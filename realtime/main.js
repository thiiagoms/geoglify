require('dotenv').config();

// Import the necessary libraries
const { MongoClient } = require("mongodb");
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

// Create a MongoDB client instance using the connection string provided in the environment variables
const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);

// Create an Express app and a HTTP server
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origins: [process.env.SOCKET_CORS_ORIGIN] } });

// Create a route to handle the root URL
const clients = new Map();
let messages = new Map();
const messageQueue = [];
const NUMBER_OF_EMITS = 50;
const TIMEOUT_LOOP = 1000;
let dispatchTimeout = null;

app.use(cors());

app.get('/', (_, res) => {
  res.json('Geoglify Realtime API');
});

server.listen(8080, () => {
  console.log('Listening on *:8080');
});

// Define the connectWithRetry function
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

// Define the run function
async function run() {
  try {

    // Connect to the "geoglify" database and the "realtime" collection
    const database = client.db('geoglify');
    const realtimeMessagesCollection = database.collection('realtime');

    io.on('connection', (socket) => {
      clients.set(socket.id, socket);
      socket.on('disconnect', () => clients.delete(socket.id));
    });

    const options = { fullDocument: 'updateLookup' };
    const changeStream = realtimeMessagesCollection.watch([], options);

    // Listen for changes on the "realtime" collection
    changeStream.on('change', async (change) => {
      let ship = change.fullDocument;
      messages.set(ship.mmsi, ship);

      if (ship && !messageQueue.includes(ship.mmsi)) {
        messageQueue.push(ship.mmsi);
      }
    });

    startDispatchLoop();
  } catch (error) {
    console.log("[ERROR] " + error);
    await client.close();
  }
}

// Define the startDispatchLoop function
async function startDispatchLoop() {
  if (dispatchTimeout) {
    clearTimeout(dispatchTimeout);
  }

  let current_length = messageQueue.length;
  let chunk = messageQueue.splice(0, NUMBER_OF_EMITS);

  console.info('[' + new Date().toLocaleString("en-GB", { timeZone: "UTC" }) + '] ' + `Dispatch ` + chunk.length + " of " + current_length + " messages");

  // Dispatch the messages
  for (let i = 0; i < chunk.length; i++) {
    let key = chunk[i];
    let message = messages.get(key);
    await emitMessage(message);
    messages.delete(key);
  }

  // Schedule the next dispatch loop
  dispatchTimeout = setTimeout(startDispatchLoop.bind(this), TIMEOUT_LOOP);
}

// Define the emitMessage function
function emitMessage(msg) {
  return new Promise((resolve) => {
    io.sockets.emit('message', msg, () => {
      resolve();
    });
  });
}

connectWithRetry();
