const { MongoClient } = require("mongodb");
const WebSocket = require("ws");

// Configurations
const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || "mongodb://root:root@localhost:27778/?directConnection=true&authMechanism=DEFAULT";
const AISSTREAM_API_KEY = process.env.AISSTREAM_API_KEY || "7fb1e16f93a4d520d83a95e325c55e69b3b4fc0b";
const AIS_SERVER_HOST = process.env.AIS_SERVER_HOST || "aisstream.io";

const TIMEOUT_LOOP = process.env.TIMEOUT_LOOP || 1000;
const NUMBER_OF_EMITS = process.env.NUMBER_OF_EMITS || 1000;

// MongoDB client
const mongoClient = new MongoClient(MONGODB_CONNECTION_STRING);

// Variables to store AIS messages and ships list
let aisMessageBuffer = [];
let aisMessageDB = new Map();
let isIndexCreated = false;
let isProcessing = false;

// Logging function for information messages
function logInfo(message) {
  console.info(`\x1b[33m[${new Date().toLocaleString({ timeZone: "UTC" })}]\x1b[0m ${message}`);
}

// Logging function for error messages
function logError(message) {
  console.error(`\x1b[31m[${new Date().toLocaleString({ timeZone: "UTC" })}]\x1b[0m ${message}`);
}

// Logging function for success messages
function logSuccess(message) {
  console.info(`\x1b[32m[${new Date().toLocaleString({ timeZone: "UTC" })}]\x1b[0m ${message}`);
}

// Loggin function for warning messages
function logWarning(message) {
  console.info(`\x1b[90m[${new Date().toLocaleString({ timeZone: "UTC" })}]\x1b[0m ${message}`);
}

// Function to connect to MongoDB with retry mechanism
async function connectToMongoDBWithRetry() {
  try {
    logWarning("Connecting to MongoDB...");
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
  const shipsMessagesCollection = database.collection("ships");
  const realtimeMessagesCollection = database.collection("realtime");
  const historicalMessagesCollection = database.collection("historical");

  // Function to process and save messages in the database
  async function processAndSaveMessages() {
    if (!isProcessing && aisMessageBuffer.length > 0) {
      isProcessing = true;

      const bulkShipsOperations = [];
      const bulkRealtimeOperations = [];
      const bulkHistoricalOperations = [];

      const bufferSize = Math.min(aisMessageBuffer.length, NUMBER_OF_EMITS);

      for (let i = 0; i < bufferSize; i++) {
        const mmsi = aisMessageBuffer[i];
        const message = aisMessageDB.get(mmsi);

        delete message._id;
        let now = new Date();

        // Ship object - to be inserted or updated in the ships collection
        let ship = {
          mmsi: message.mmsi,
          shipname: message.shipname,
          dimA: message.dimA,
          dimB: message.dimB,
          dimC: message.dimC,
          dimD: message.dimD,
          imo: message.imo,
          callsign: message.callsign,
          draught: message.draught,
          cargo: message.cargo,
          updated_at: now,
          ais_server_host: message.ais_server_host,
        };

        // Remove empty fields
        for (const key in ship) {
          if (ship.hasOwnProperty(key) && (ship[key] === null || ship[key] === undefined || ship[key] === "")) {
            delete ship[key];
          }
        }

        // Add ship object to bulk operations
        bulkShipsOperations.push({
          updateOne: {
            filter: { mmsi: mmsi },
            update: {
              $set: ship,
            },
            upsert: true,
          },
        });


        // Realtime object - to be inserted or updated in the realtime collection
        let realtime = {
          mmsi: message.mmsi,
          location: message.location,
          cog: message.cog,
          sog: message.sog,
          hdg: message.hdg,
          utc: message.utc,
          updated_at: now,
          eta: message.eta,
          destination: message.destination,
          expired_at: new Date(now.getTime() + 30 * 60 * 1000),
          ais_server_host: message.ais_server_host,
        };

        // Remove empty fields
        for (const key in realtime) {
          if (realtime.hasOwnProperty(key) && (realtime[key] === null || realtime[key] === undefined || realtime[key] === "")) {
            delete realtime[key];
          }
        }

        // Add realtime object to bulk operations
        bulkRealtimeOperations.push({
          updateOne: {
            filter: { mmsi: mmsi },
            update: {
              $set: realtime,
            },
            upsert: true,
          },
        });

        // Historical object - to be inserted in the historical collection
        let historical = {
          mmsi: message.mmsi,
          location: message.location,
          cog: message.cog,
          sog: message.sog,
          hdg: message.hdg,
          utc: message.utc,
          updated_at: now,
          eta: message.eta,
          destination: message.destination,
          expired_at: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          ais_server_host: message.ais_server_host,
        };

        for (const key in historical) {
          if (historical.hasOwnProperty(key) && (historical[key] === null || historical[key] === undefined || historical[key] === "")) {
            delete historical[key];
          }
        }
        
        // Remove empty fields
        bulkHistoricalOperations.push({
          insertOne: historical,
        });
      }

      try {
        // Bulk write operations - ships, realtime and historical collections

        // Ships collection
        logInfo(`Inserting or Updating ${bulkShipsOperations.length} operations into the ships collection...`);
        await shipsMessagesCollection.bulkWrite(bulkShipsOperations, {
          ordered: false,
        });
        logSuccess("Ships saved successfully!\n");

        // Realtime and Historical collections
        logInfo(`Inserting or Updating ${bulkRealtimeOperations.length} operations into the realtime collection...`);
        await realtimeMessagesCollection.bulkWrite(bulkRealtimeOperations, {
          ordered: false,
        });
        logSuccess("Realtime messages saved successfully!\n");

        // Historical collection
        logInfo(`Inserting or Updating ${bulkHistoricalOperations.length} operations into the historical collection...`);
        await historicalMessagesCollection.bulkWrite(bulkHistoricalOperations, {
          ordered: false,
        });
        logSuccess("Historical messages saved successfully!\n");

        // Remove processed messages from aisMessageBuffer
        aisMessageBuffer.splice(0, bufferSize);
        logInfo(`Remaining in aisMessageBuffer: ${aisMessageBuffer.length}`);

      } catch (error) {
        logError("Error while processing bulk operations\n");
      }

      isProcessing = false;
    } else {
      logError("No messages to process or already processing...");
    }
  }

  // Set interval to process and save messages every TIMEOUT_LOOP seconds
  setInterval(processAndSaveMessages, TIMEOUT_LOOP);

  // Create an index for expired_at field if not already created
  if (!isIndexCreated) {
    
    shipsMessagesCollection.createIndex({ mmsi: 1 }, { unique: true });

    realtimeMessagesCollection.createIndex({ expired_at: 1 }, { expireAfterSeconds: 0 });
    historicalMessagesCollection.createIndex({ expired_at: 1 }, { expireAfterSeconds: 0 });

    realtimeMessagesCollection.createIndex({ location: "2dsphere" });
    historicalMessagesCollection.createIndex({ location: "2dsphere" });

    logSuccess("Indexes created successfully!\n");

    isIndexCreated = true;
  }
}

// Function to connect to AIS stream with retry mechanism
async function connectToAisStreamWithRetry() {
  try {
    logWarning("Connecting to AIS stream...\n");
    const socket = new WebSocket("wss://stream.aisstream.io/v0/stream");

    // WebSocket event handlers
    socket.onopen = function (_) {
      logSuccess("Connected to AIS stream\n ");
      let subscriptionMessage = {
        Apikey: AISSTREAM_API_KEY,
        //Portugal + Spain
        BoundingBoxes: [
          [
            [29.343875, -35.419922],
            [45.690833, 6.394043],
          ],
        ],
        /*BoundingBoxes: [
          [
            [-90, -180],
            [90, 180],
          ],
        ]*/
      };
      socket.send(JSON.stringify(subscriptionMessage));
    };

    socket.onclose = function (_) {
      logError("WebSocket Closed, retrying...");
      setTimeout(connectToAisStreamWithRetry, 5000);
    };

    socket.onmessage = async (event) => {
      let aisMessage = JSON.parse(event.data);
      //logInfo("Received data from AIS stream!", aisMessage);
      processAisMessage(aisMessage);
    };

    startProcessing();
  } catch (err) {
    logError("Failed to connect to AIS stream, retrying...");
    setTimeout(connectToAisStreamWithRetry, 5000);
  }
}

// Function to process AIS and NMEA messages
function processAisMessage(message) {
  message = decodeStreamMessage(message);

  aisMessageDB.set(message.mmsi, message);

  if (!aisMessageBuffer.includes(message.mmsi)) aisMessageBuffer.push(message.mmsi);
}

function decodeStreamMessage(message) {
  //logSuccess("Decoded AIS message MMSI: \x1b[32m" + message.MetaData.MMSI + "\n\x1b[0m");

  let ship = {
    mmsi: message.MetaData.MMSI.toString(),
    shipname: message.MetaData.ShipName.trim(),
    utc: new Date(message.MetaData.time_utc),
    location: {
      type: "Point",
      coordinates: [message.MetaData.longitude, message.MetaData.latitude],
    },
    ais_server_host: AIS_SERVER_HOST,
    cog: message?.Message?.PositionReport?.Cog || message?.Message?.StandardClassBPositionReport?.Cog,
    sog: message?.Message?.PositionReport?.Sog || message?.Message?.StandardClassBPositionReport?.Sog,
    hdg: message?.Message?.PositionReport?.TrueHeading || message?.Message?.StandardClassBPositionReport?.TrueHeading,
    dimA: message?.Message?.ShipStaticData?.Dimension?.A,
    dimB: message?.Message?.ShipStaticData?.Dimension?.B,
    dimC: message?.Message?.ShipStaticData?.Dimension?.C,
    dimD: message?.Message?.ShipStaticData?.Dimension?.D,
    imo: message?.Message?.ShipStaticData?.ImoNumber,
    destination: message?.Message?.ShipStaticData?.Destination,
    cargo: message?.Message?.ShipStaticData?.Type,
    callsign: message?.Message?.ShipStaticData?.CallSign,
    draught: message?.Message?.ShipStaticData?.MaximumStaticDraught,
    imo: message?.Message?.ShipStaticData?.ImoNumber,
  };

  let etaObj = message?.Message?.ShipStaticData?.Eta;
  let eta = etaObj ? new Date(etaObj.Year ?? new Date().getFullYear(), etaObj.Month, etaObj.Day, etaObj.Hour, etaObj.Minute) : null;

  ship.eta = eta;

  return ship;
}

// Start the process by connecting to MongoDB and AIS stream
connectToMongoDBWithRetry();
connectToAisStreamWithRetry();
