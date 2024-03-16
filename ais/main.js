require("dotenv").config();
const { MongoClient } = require("mongodb");
const WebSocket = require("ws");
const express = require("express");
const http = require("http");
const cors = require("cors");

// MongoDB client
const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);

// Express app and server setup
const app = express();
const server = http.createServer(app);

// Server listening on port 8080
app.get("/", (_, res) => {
  res.send("AIS Realtime");
});

app.use(cors());

server.listen(8080, () => {
  logInfo("Server listening on *:8080");
});

// Variables for storing AIS messages and ships list
let messageBuffer = [];
let messageDB = new Map();
let shipsListDB = new Map();
let isIndexCreated = false;
let isProcessing = false;

// Function to retrieve all ships and store in a Map
async function getAllShipsToMap() {
  logInfo("Retrieving ships list...");
  try {
    await client.connect();
    const database = client.db("geoglify");
    const ships = database.collection("ships");
    const documents = await ships.find({}).toArray();
    const db = new Map();
    for (const document of documents) {
      db.set(document.mmsi, document);
    }
    logInfo("Ships list successfully retrieved");
    return db;
  } catch (err) {
    logError("Error retrieving ships list", err);
    throw err;
  }
}

// Function to connect to MongoDB with retry mechanism
async function connectWithRetry() {
  try {
    await client.connect();
    logInfo("MongoDB Connected");
    await run();
  } catch (err) {
    logInfo("Failed to connect to MongoDB, retrying...");
    setTimeout(connectWithRetry, 5000);
  }
}

// Main processing function
async function run() {
  const database = client.db("geoglify");
  const realtimeMessagesCollection = database.collection("realtime");
  const shipsCollection = database.collection("ships");
  const messagesCollection = database.collection("messages");

  shipsListDB = await getAllShipsToMap();

  const socket = new WebSocket("wss://stream.aisstream.io/v0/stream");

  // WebSocket event handlers
  socket.onopen = function (_) {
    logInfo("WebSocket Connected");
    let subscriptionMessage = {
      Apikey: process.env.AISSTREAM_TOKEN,
      /*BoundingBoxes: [
        [
          [180, -90],
          [-180, 90],
        ],
      ],*/ // World bounding box
      BoundingBoxes: [
        [
          [27.955591, -40.012207],
          [44.574817, 1.801758],
        ],
      ],
    };
    socket.send(JSON.stringify(subscriptionMessage));
  };

  socket.onmessage = async (event) => {
    let aisMessage = JSON.parse(event.data);
    let mmsi = aisMessage?.MetaData?.MMSI;

    if (mmsi) {
      let message = null;
      let now = new Date();

      if (aisMessage.MessageType == "PositionReport") {
        message = {
          mmsi: mmsi,
          name: aisMessage.MetaData.ShipName,
          time_utc: new Date(aisMessage.MetaData.time_utc),
          cog: aisMessage.Message.PositionReport.Cog,
          sog: aisMessage.Message.PositionReport.Sog,
          hdg: aisMessage.Message.PositionReport.TrueHeading,
          location: {
            type: "Point",
            coordinates: [
              aisMessage.MetaData.longitude,
              aisMessage.MetaData.latitude,
            ],
          },
          expire_at: new Date(now.getTime() + 30 * 60 * 1000), // Set expiration time to 30 minutes in the future
        };
      } else if (aisMessage.MessageType == "ShipStaticData") {
        let etaObj = aisMessage.Message.ShipStaticData.Eta;
        let eta = etaObj
          ? new Date(
              etaObj.Year ?? new Date().getFullYear(),
              etaObj.Month,
              etaObj.Day,
              etaObj.Hour,
              etaObj.Minute
            )
          : null;
        message = {
          mmsi: mmsi,
          name: aisMessage.MetaData.ShipName,
          time_utc: new Date(aisMessage.MetaData.time_utc),
          dimension: aisMessage.Message.ShipStaticData.Dimension,
          eta: eta,
          imo: aisMessage.Message.ShipStaticData.ImoNumber,
          destination: aisMessage.Message.ShipStaticData.Destination,
          cargo_type_code: aisMessage.Message.ShipStaticData.Type,
          location: {
            type: "Point",
            coordinates: [
              aisMessage.MetaData.longitude,
              aisMessage.MetaData.latitude,
            ],
          },
          expire_at: new Date(now.getTime() + 30 * 60 * 1000), // Set expiration time to 30 minutes in the future
        };
      } else {
        message = {
          mmsi: mmsi,
          name: aisMessage.MetaData.ShipName,
          time_utc: new Date(aisMessage.MetaData.time_utc),
          location: {
            type: "Point",
            coordinates: [
              aisMessage.MetaData.longitude,
              aisMessage.MetaData.latitude,
            ],
          },
          expire_at: new Date(now.getTime() + 30 * 60 * 1000), // Set expiration time to 30 minutes in the future
        };
      }

      const foundShip = shipsListDB.get(mmsi);

      if (foundShip && message) {
        message = {
          ...message,
          ...Object.fromEntries(
            Object.entries(foundShip).filter(
              ([key, value]) => !message[key] || message[key] === null
            )
          ),
        };
      }

      messageDB.set(mmsi, message);

      if (!messageBuffer.includes(mmsi)) messageBuffer.push(mmsi);
    }
  };

  // Function to process and save messages in the database
  async function processAndSaveMessages() {
    if (!isProcessing && messageBuffer.length > 0) {
      // Add a check to ensure there are messages in the buffer
      logInfo("Processing...");
      isProcessing = true;

      const bulkOperations = [];
      const bulkOperationsShips = [];
      let max = 0;

      // Limit the size of bulk operations to the current buffer size
      const bufferSize = Math.min(messageBuffer.length, 200); // Limit to 200 or the current buffer size

      for (let i = 0; i < bufferSize; i++) {
        max++;

        const mmsi = messageBuffer[i];
        const message = messageDB.get(mmsi);

        //delete prop _id from message
        delete message._id;

        bulkOperations.push({
          updateOne: {
            filter: { mmsi: mmsi },
            update: { $set: message },
            upsert: true,
          },
        });

        // new bulk to update the ships collection if it's not already there

        /*bulkOperationsShips.push({
          updateOne: {
            filter: { mmsi: mmsi },
            update: {
              $set: {
                name: message.name,
                imo: message.imo,
                mmsi: message.mmsi,
                dimension: message.dimension,
                cargo_type_code: message.cargo_type_code,
              },
            },
            upsert: true,
          },
        });*/
      }

      try {
        logInfo(
          `Inserting or Updating ${bulkOperations.length} operations into the realtime collection...`
        );

        // Use promises to ensure bulk operations are completed before continuing
        await realtimeMessagesCollection.bulkWrite(bulkOperations, {
          ordered: false,
        });

        messageBuffer.splice(0, bufferSize); // Remove only the number of processed messages
        logInfo(`Remaining in messageBuffer: ${messageBuffer.length}`);
      } catch (error) {
        logError("Error while processing bulk operations", error);
      }

      /*
      if (bulkOperationsShips.length > 0) {
        logInfo(
          `Inserting or Updating ${bulkOperationsShips.length} operations into the ships collection...`
        );

        try {
          // Use promises to ensure bulk operations are completed before continuing
          await shipsCollection.bulkWrite(bulkOperationsShips, {
            ordered: false,
          });
        } catch (error) {
          logError("Error while processing bulk operations for ships", error);
        }
      }*/

      isProcessing = false;
    } else {
      logInfo("No messages to process or already processing...");
    }
  }

  // Set interval to process and save messages every 1 seconds
  setInterval(processAndSaveMessages, 1000);

  // Create an index for expire_at field if not already created
  if (!isIndexCreated) {
    logInfo("Creating an index for expire_at field");
    realtimeMessagesCollection.createIndex(
      { expire_at: 1 },
      { expireAfterSeconds: 0 }
    );
    isIndexCreated = true;
  }
}

// Call the connectWithRetry function to start the process
connectWithRetry();

// Logging function for information messages
function logInfo(message) {
  console.info(
    `[${new Date().toLocaleString("en-GB", { timeZone: "UTC" })}] ${message}`
  );
}

// Logging function for error messages
function logError(message, error) {
  console.error(
    `[${new Date().toLocaleString("en-GB", { timeZone: "UTC" })}] ${message}`,
    error
  );
}
