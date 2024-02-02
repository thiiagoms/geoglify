require('dotenv').config();
const { MongoClient } = require("mongodb");
const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const cors = require('cors');

// Constants
const EXPIRATION_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds

// MongoDB client
const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);

// Express app and server setup
const app = express();
const server = http.createServer(app);

// Server listening on port 8080
app.get('/', (_, res) => {
    res.send('AIS Realtime');
});

app.use(cors());

server.listen(8080, () => {
    logInfo('Server listening on *:8080');
});

// Variables for storing AIS messages and ships list
let messageBuffer = [];
let messageDB = new Map();
let shipsListDB = new Map();
let isIndexCreated = false;
let isProcessing = false;

// Function to retrieve all ships and store in a Map
async function getAllShipsToMap() {
    logInfo('Retrieving ships list...');
    try {
        await client.connect();
        const database = client.db('geoglify');
        const ships = database.collection('ships');
        const documents = await ships.find({}).toArray();
        const db = new Map();
        for (const document of documents) {
            db.set(document.mmsi, document);
        }
        logInfo('Ships list successfully retrieved');
        return db;
    } catch (err) {
        logError('Error retrieving ships list', err);
        throw err;
    }
}

// Function to connect to MongoDB with retry mechanism
async function connectWithRetry() {
    try {
        await client.connect();
        logInfo('MongoDB Connected');
        await run();
    } catch (err) {
        logInfo('Failed to connect to MongoDB, retrying...');
        setTimeout(connectWithRetry, 5000);
    }
}

// Main processing function
async function run() {
    const database = client.db('geoglify');
    const aisMessagesCollection = database.collection('ais');

    shipsListDB = await getAllShipsToMap();

    const socket = new WebSocket("wss://stream.aisstream.io/v0/stream");

    // WebSocket event handlers
    socket.onopen = function (_) {
        logInfo('WebSocket Connected');
        let subscriptionMessage = {
            Apikey: process.env.AISSTREAM_TOKEN,
            //BoundingBoxes: [[[180, -90], [-180, 90]]], // World bounding box
            BoundingBoxes: [[[27.955591, -40.012207], [44.574817, 1.801758]]],
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
                    location: { type: "Point", coordinates: [aisMessage.MetaData.longitude, aisMessage.MetaData.latitude] },
                    message_type: aisMessage.MessageType,
                    expire_at: new Date(now.getTime() + 30 * 60 * 1000), // Set expiration time to 30 minutes in the future
                }
            } else if (aisMessage.MessageType == "ShipStaticData") {
                let etaObj = aisMessage.Message.ShipStaticData.Eta;
                let eta = etaObj ? new Date(etaObj.Year ?? new Date().getFullYear(), etaObj.Month, etaObj.Day, etaObj.Hour, etaObj.Minute) : null;
                message = {
                    mmsi: mmsi,
                    name: aisMessage.MetaData.ShipName,
                    time_utc: new Date(aisMessage.MetaData.time_utc),
                    dimension: aisMessage.Message.ShipStaticData.Dimension,
                    eta: eta,
                    imo: aisMessage.Message.ShipStaticData.ImoNumber,
                    cargo_code: aisMessage.Message.ShipStaticData.Type,
                    call_sign: aisMessage.Message.ShipStaticData.CallSign,
                    destination: aisMessage.Message.ShipStaticData.Destination,
                    draught: aisMessage.Message.ShipStaticData.MaximumStaticDraught,
                    location: { type: "Point", coordinates: [aisMessage.MetaData.longitude, aisMessage.MetaData.latitude] },
                    message_type: aisMessage.MessageType,
                    expire_at: new Date(now.getTime() + 30 * 60 * 1000), // Set expiration time to 30 minutes in the future
                }
            } else {
                message = {
                    mmsi: mmsi,
                    name: aisMessage.MetaData.ShipName,
                    time_utc: new Date(aisMessage.MetaData.time_utc),
                    location: { type: "Point", coordinates: [aisMessage.MetaData.longitude, aisMessage.MetaData.latitude] },
                    message_type: aisMessage.MessageType,
                    expire_at: new Date(now.getTime() + 30 * 60 * 1000), // Set expiration time to 30 minutes in the future
                }
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

            if (!messageBuffer.includes(mmsi))
                messageBuffer.push(mmsi);
        }
    };

    // Function to process and save messages to MongoDB
    async function processAndSaveMessages() {
        if (!isProcessing) {
            logInfo("Processing...");
            isProcessing = true;

            const bulkOperations = [];

            for (const mmsi of messageBuffer) {
                let message = messageDB.get(mmsi);

                bulkOperations.push({
                    updateOne: {
                        filter: { mmsi: mmsi },
                        update: { $set: message },
                        upsert: true
                    }
                });
            }

            if (bulkOperations.length) {
                logInfo(`Inserting ${bulkOperations.length} operations into the database...`);
                await aisMessagesCollection.bulkWrite(bulkOperations, { ordered: false });
                logInfo(`Bulk write completed with ${bulkOperations.length} operations`);
                messageBuffer.splice(0, bulkOperations.length);
                logInfo(`Remaining in messageBuffer: ${messageBuffer.length}`);
                isProcessing = false;
            } else {
                isProcessing = false;
            }
        }
    }

    // Set interval to process and save messages every 1 seconds
    setInterval(processAndSaveMessages, 1000);

    // Create an index for expire_at field if not already created
    if (!isIndexCreated) {
        logInfo('Creating an index for expire_at field');
        aisMessagesCollection.createIndex({ "expire_at": 1 }, { expireAfterSeconds: 0 });
        isIndexCreated = true;
    }
}

// Call the connectWithRetry function to start the process
connectWithRetry();

// Logging function for information messages
function logInfo(message) {
    console.info(`[${new Date().toLocaleString("en-GB", { timeZone: "UTC" })}] ${message}`);
}

// Logging function for error messages
function logError(message, error) {
    console.error(`[${new Date().toLocaleString("en-GB", { timeZone: "UTC" })}] ${message}`, error);
}