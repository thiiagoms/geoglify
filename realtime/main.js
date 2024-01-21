// Import the dotenv library to load environment variables from a .env file
require('dotenv').config();

// Import the necessary libraries
const { MongoClient } = require("mongodb");
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

// Create a MongoDB client instance using the connection string provided in the environment variables
const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origins: [process.env.SOCKET_CORS_ORIGIN]
  }
});

const clients = new Map();
let messages = new Map();
const messageQueue = [];
const NUMBER_OF_EMITS = 50;
const TIMEOUT_LOOP = 1000; // seconds
let dispatchTimeout = null;

app.use(cors());

// Create a route to handle the root URL
app.get('/', (_, res) => {
  // Return shipsListDB as JSON response
  res.json('Geoglify Realtime API');
});


// Create a route to handle the root URL
app.get('/ships', (_, res) => {
  // Return shipsListDB as JSON response
  res.json(Array.from(messages.values()));
});

// Start the server on port 8080
server.listen(8080, () => {
  console.log('Listening on *:8080');
});

async function connectWithRetry() {
  try {
    await client.connect();

    console.info('[' + new Date().toLocaleString("en-GB", { timeZone: "UTC" }) + '] MongoDB Connected');

    await run();

  } catch (err) {

    console.info('[' + new Date().toLocaleString("en-GB", { timeZone: "UTC" }) + '] Failed to connect to MongoDB, retrying...');

    setTimeout(connectWithRetry, 5000);
  }
}

async function getAllShipsToMap() {

  console.info('[' + new Date().toLocaleString("en-GB", { timeZone: "UTC" }) + '] Retrieving ships list...');

  return new Promise(async (resolve, reject) => {
    try {
      await client.connect();

      const database = client.db('geoglify');
      const aisMessagesCollection = database.collection('ais_messages');

      const documents = await aisMessagesCollection.find({ hdg: { $nin: [null, 511] } }).project({
        mmsi: 1,
        expire_at: 1,
        hdg: 1,
        location: 1,
        ship_name: 1,
        time_utc: 1,
        calls_sign: 1,
        cargo_type: 1,
        destination: 1,
        eta: 1,
        imo: 1,
        cargo_name: 1
      }).toArray();

      documents.forEach((doc) => {
        messages.set(doc.mmsi, doc);
      });

      console.info('[' + new Date().toLocaleString("en-GB", { timeZone: "UTC" }) + '] Ships list successfully retrieved');

      resolve(messages);

    } catch (err) {

      console.log(`[${new Date().toLocaleString("en-GB", { timeZone: "UTC" })}] Error retrieving ships list`);

      reject(err);
    }
  });
}

// Main asynchronous function to initialize the application
async function run() {
  try {

    const database = client.db('geoglify');
    const aisMessagesCollection = database.collection('ais_messages');

    messages = await getAllShipsToMap();

    // Initialize socket connections
    io.on('connection', (socket) => {
      console.info('[' + new Date().toLocaleString("en-GB", { timeZone: "UTC" }) + '] ' + `Client connected [id=${socket.id}]`);
      clients.set(socket.id, socket);

      // Handle client disconnection
      socket.on('disconnect', () => {
        console.info('[' + new Date().toLocaleString("en-GB", { timeZone: "UTC" }) + '] ' + `Client disconnected [id=${socket.id}]`);
        clients.delete(socket.id);
      });
    });

    const options = { fullDocument: 'updateLookup' };

    // Crie um cursor de change stream na coleção 'ais_messages'
    const changeStream = aisMessagesCollection.watch([], options);

    // Monitore as mudanças no change stream
    changeStream.on('change', async (change) => {

      let ship = change.fullDocument;
      if (ship) {
        messages.set(ship.mmsi, ship);
        if (!messageQueue.includes(ship.mmsi)) {
          messageQueue.push(ship.mmsi);
        }
      }

    });

    startDispatchLoop();

  } catch (error) {
    // Handle errors, close the client connection, and display an error message
    console.log("[ERROR] " + error);
    await client.close();
  }
}

// Function to start the message dispatch loop
async function startDispatchLoop() {
  if (dispatchTimeout) {
    clearTimeout(dispatchTimeout);
  }

  let current_length = messageQueue.length;

  // Get messages chunks to send
  let chunk = messageQueue.splice(0, NUMBER_OF_EMITS);

  console.info('[' + new Date().toLocaleString("en-GB", { timeZone: "UTC" }) + '] ' + `Dispatch ` + chunk.length + " of " + current_length + " messages");

  // Emit each message to connected clients
  for (let i = 0; i < chunk.length; i++) {
    let key = chunk[i];
    let message = messages.get(key);
    await emitMessage(message);
  }

  // Set a timeout to continue the dispatch loop
  dispatchTimeout = setTimeout(startDispatchLoop.bind(this), TIMEOUT_LOOP);
}

// Function to emit a message to connected clients
function emitMessage(msg) {
  return new Promise((resolve) => {
    io.sockets.emit('message', msg, () => {
      resolve();
    });
  });
}

connectWithRetry();