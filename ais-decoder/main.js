const readline = require("readline");
const { MongoClient } = require("mongodb");
const net = require("net");
const { log } = require("console");
const exp = require("constants");
const AisDecode = require("ggencoder").AisDecode;
const session = {};

// Configurations
const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || "mongodb://root:root@localhost:27778/?directConnection=true&authMechanism=DEFAULT";
const AIS_SERVER_HOST = process.env.AIS_SERVER_HOST || "153.44.253.27";
const AIS_SERVER_PORT = process.env.AIS_SERVER_PORT || 5631;

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

// Function to connect to AIS server with retry mechanism
async function connectToAisServerWithRetry() {
  try {
    let aisSocket = new net.Socket();
    logWarning("Connecting to AIS server...\n");

    aisSocket.connect(AIS_SERVER_PORT, AIS_SERVER_HOST, function () {
      logSuccess("Connected to AIS server\n");
      startProcessing();
    });

    var lineReader = readline.createInterface({
      input: aisSocket,
      output: aisSocket,
      terminal: false,
    });

    lineReader.on("line", function (message) {
      const regex = /\\([^\\]+)\\/g;
      const inputString = message.toString();
      const outputString = inputString.replace(regex, "");
      logInfo("Received AIS message: " + outputString);
      processAisMessage(outputString);
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
  var decMsg = new AisDecode(message, session);
  if (decMsg.valid) logSuccess("Decoded AIS message \x1b[32m MMSI: " + decMsg.mmsi + ", Lat: " + decMsg?.lat + ", Lon: " + decMsg?.lon + "\n\x1b[0m");

  if (decMsg.valid) {
    let now = new Date();

    message = {
      ...decMsg,
      utc: new Date(now.getTime() - decMsg.utc),
      ais_server_host: AIS_SERVER_HOST
    };

    if (!!decMsg["lat"] && !!decMsg["lon"]) {
      message["location"] = {
        type: "Point",
        coordinates: [message.lon, message.lat],
      };
    }

    delete message.bitarray;
    delete message.valid;
    delete message.payload;
    delete message.mmsikey;

    aisMessageDB.set(message.mmsi, message);

    if (!aisMessageBuffer.includes(message.mmsi)) aisMessageBuffer.push(message.mmsi);
  }
}

// Start the process by connecting to MongoDB and AIS server
connectToMongoDBWithRetry();
connectToAisServerWithRetry();
