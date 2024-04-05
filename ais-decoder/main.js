const { MongoClient } = require("mongodb");
const net = require("net");
const { decode } = require("punycode");
const AisDecode = require("ggencoder").AisDecode;
const NmeaDecode = require("ggencoder").NmeaDecode;

// Configurations
const MONGODB_CONNECTION_STRING =
  process.env.MONGODB_CONNECTION_STRING ||
  "mongodb://root:root@localhost:27778/?directConnection=true&authMechanism=DEFAULT";
const AIS_SERVER_HOST = process.env.AIS_SERVER_HOST || "153.44.253.27";
const AIS_SERVER_PORT = process.env.AIS_SERVER_PORT || 5631;

// MongoDB client
const mongoClient = new MongoClient(MONGODB_CONNECTION_STRING);

// Variables to store AIS messages and ships list
let aisMessageBuffer = [];
let aisMessageDB = new Map();
let isIndexCreated = false;
let isProcessing = false;

// Logging function for information messages
function logInfo(message) {
  console.info(
    `[${new Date().toLocaleString("en-GB", { timeZone: "UTC" })}] ${message}`
  );
}

// Logging function for error messages
function logError(message) {
  console.error(
    `[${new Date().toLocaleString("en-GB", { timeZone: "UTC" })}] ${message}`
  );
}

// Logging function for success messages
function logSuccess(message) {
  console.info(
    `[${new Date().toLocaleString("en-GB", { timeZone: "UTC" })}] ${message}`
  );
}

// Function to connect to MongoDB with retry mechanism
async function connectToMongoDBWithRetry() {
  try {
    await mongoClient.connect();
    logSuccess("MongoDB Connected");
  } catch (err) {
    logError("Failed to connect to MongoDB, retrying...");
    setTimeout(connectToMongoDBWithRetry, 5000);
  }
}

// Main processing function
async function startProcessing() {
  const database = mongoClient.db("geoglify");
  const realtimeMessagesCollection = database.collection("realtime");

  // Function to process and save messages in the database
  async function processAndSaveMessages() {
    if (!isProcessing && aisMessageBuffer.length > 0) {
      isProcessing = true;

      const bulkOperations = [];

      const bufferSize = Math.min(aisMessageBuffer.length, 200);

      for (let i = 0; i < bufferSize; i++) {
        const mmsi = aisMessageBuffer[i];
        const message = aisMessageDB.get(mmsi);

        delete message._id;

        bulkOperations.push({
          updateOne: {
            filter: { mmsi: mmsi },
            update: { $set: message },
            upsert: true,
          },
        });
      }

      try {
        logInfo(
          `Inserting or Updating ${bulkOperations.length} operations into the realtime collection...`
        );
        await realtimeMessagesCollection.bulkWrite(bulkOperations, {
          ordered: false,
        });
        aisMessageBuffer.splice(0, bufferSize);
        logInfo(`Remaining in aisMessageBuffer: ${aisMessageBuffer.length}`);
      } catch (error) {
        logError("Error while processing bulk operations");
      }

      isProcessing = false;
    } else {
      logError("No messages to process or already processing...");
    }
  }

  // Set interval to process and save messages every 5 seconds
  setInterval(processAndSaveMessages, 5000);

  // Create an index for expire_at field if not already created
  if (!isIndexCreated) {
    realtimeMessagesCollection.createIndex(
      { expire_at: 1 },
      { expireAfterSeconds: 0 }
    );
    isIndexCreated = true;
  }
}

// Function to connect to AIS server with retry mechanism
async function connectToAisServerWithRetry() {
  try {
    let aisSocket = new net.Socket();
    logInfo("Connecting to AIS server...");

    aisSocket.connect(AIS_SERVER_PORT, AIS_SERVER_HOST, function () {
      startProcessing();
    });

    aisSocket.on("data", function (data) {
      const regex = /\\([^\\]+)\\/g;
      const inputString = data.toString();
      const outputString = inputString.replace(regex, "");

      const messages = outputString.split("\n");
      for (const message of messages) {
        if (message.trim() !== "") {
          logInfo("Received data from AIS server: " + message.trim());
          processAisMessage(message.trim());
        }
      }
    });

    aisSocket.on("error", function (err) {
      logError("Error while connecting to AIS server: " + err);
      setTimeout(connectToAisServerWithRetry, 5000);
    });
  } catch (err) {
    logError("Failed to connect to AIS server, retrying...");
    setTimeout(connectToAisServerWithRetry, 5000);
  }
}

// Function to process AIS and NMEA messages
function processAisMessage(message) {
  var decMsg = new AisDecode(message, {});
  if (decMsg.valid) logInfo("Decoded AIS message [Ship MMSI]: " + decMsg.mmsi);

  if (decMsg.valid) {
    let now = new Date();

    message = {
      ...decMsg,
      location: {
        type: "Point",
        coordinates: [decMsg.lon, decMsg.lat],
      },
      utc: new Date(now.getTime() - decMsg.utc),
      expire_at: new Date(now.getTime() + 30 * 60 * 1000), // Set expiration time to 30 minutes in the future
      ais_server_host: AIS_SERVER_HOST,
    };

    delete message.bitarray;
    delete message.valid;
    delete message.payload;
    delete message.lon;
    delete message.lat;
    delete message.mmsikey;

    //console.log(decMsg);
    aisMessageDB.set(message.mmsi, message);

    if (!aisMessageBuffer.includes(message.mmsi))
      aisMessageBuffer.push(message.mmsi);
  }
}

// Start the process by connecting to MongoDB and AIS server
connectToMongoDBWithRetry();
connectToAisServerWithRetry();
