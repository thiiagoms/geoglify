// Import necessary libraries
const { MongoClient } = require("mongodb");
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const turf = require("@turf/turf");

// Configurations
const MONGODB_CONNECTION_STRING =
  process.env.MONGODB_CONNECTION_STRING ||
  "mongodb://root:root@localhost:27778/?directConnection=true&authMechanism=DEFAULT";

// MongoDB client
const mongoClient = new MongoClient(MONGODB_CONNECTION_STRING);

// Socket CORS origin
const SOCKET_CORS_ORIGIN = ["http://localhost", "http://geoglify.com", "https://localhost", "https://geoglify.com"];
const NUMBER_OF_EMITS = process.env.NUMBER_OF_EMITS || 25;
const TIMEOUT_LOOP = process.env.TIMEOUT_LOOP || 500;

// Create an Express app and an HTTP server
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origins: SOCKET_CORS_ORIGIN },
});

// Create a route to handle the root URL
let messages = new Map();
const messageQueue = [];
let dispatchTimeout = null;

app.use(cors());

server.listen(8080, () => {
  logSuccess("Server running on port 8080");
});

// Logging function for information messages
function logInfo(message) {
  console.info(
    `\x1b[33m[${new Date().toLocaleString("en-GB", {
      timeZone: "UTC",
    })}]\x1b[0m ${message}`
  );
}

// Logging function for error messages
function logError(message) {
  console.error(
    `\x1b[31m[${new Date().toLocaleString("en-GB", {
      timeZone: "UTC",
    })}]\x1b[0m ${message}`
  );
}

// Logging function for success messages
function logSuccess(message) {
  console.info(
    `\x1b[32m[${new Date().toLocaleString("en-GB", {
      timeZone: "UTC",
    })}]\x1b[0m ${message}`
  );
}

// Logging function for warning messages
function logWarning(message) {
  console.info(
    `\x1b[90m[${new Date().toLocaleString("en-GB", {
      timeZone: "UTC",
    })}]\x1b[0m ${message}`
  );
}

// Function to connect to MongoDB with retry mechanism
async function connectToMongoDBWithRetry() {
  try {
    logWarning("Connecting to MongoDB...");
    await mongoClient.connect();
    logSuccess("MongoDB Connected");
    startApplication();
  } catch (err) {
    logError("Failed to connect to MongoDB, retrying...");
    setTimeout(connectToMongoDBWithRetry, 5000);
  }
}

// Define the run function
async function startApplication() {
  try {
    // Connect to the "geoglify" database and the "realtime" collection
    const database = mongoClient.db("geoglify");
    const realtimeMessagesCollection = database.collection("realtime");

    io.on("connection", (socket) => {
      logSuccess(`Client connected: \x1b[32m${socket.id}\x1b[0m`);
      socket.on("disconnect", () =>
        logError(`Client disconnected: \x1b[31m${socket.id}\x1b[0m`)
      );
    });

    const options = { fullDocument: "updateLookup" };
    const changeStream = realtimeMessagesCollection.watch([], options);

    // Listen for changes on the "realtime" collection
    changeStream.on("change", async (change) => {
      let ship = change.fullDocument;

      if(!ship) return;

      let message = {
        _id: ship._id,
        mmsi: ship.mmsi,
        shipname: ship.shipname,
        cargo: ship.cargo,
        hdg: ship.hdg,
        location: ship.location,
        utc: ship.utc,
      };

      messages.set(message.mmsi, message);

      if (message && !messageQueue.includes(message.mmsi)) {
        messageQueue.push(message.mmsi);
      }
    });

    startDispatchLoop();
  } catch (error) {
    logError("Error running the application: " + error);
    await client.close();
  }
}

function processShipData(ship) {
  const [x, y] = ship.location.coordinates;
  const hdg = ship?.hdg; // Heading of the ship

  let geojson;

  if (!hdg || hdg === 511) {
    const length = ship?.dimA + ship?.dimB || ship.length || 20; // Length of the ship
    const width = ship?.dimC + ship?.dimD || ship.width || 20; // Width of the ship

    // Draw a circle if hdg is null or 511
    const radius = Math.max(width, length) / 2;
    geojson = turf.circle([x, y], radius, { units: "meters" });
  } else {
    const length = ship?.dimA + ship?.dimB || ship.length || 50; // Length of the ship
    const width = ship?.dimC + ship?.dimD || ship.width || 20; // Width of the ship

    // Calculate the offsets in degrees
    const xOffsetA = ship?.dimA || length / 2;
    100;
    const xOffsetB = -(ship?.dimB || length / 2);
    const yOffsetC = -(ship?.dimC || width / 2);
    const yOffsetD = ship?.dimD || width / 2;

    const yOffsetAux = xOffsetA - 10;

    // Create a polygon with a "beak" and rotate it according to the heading
    const polygon = turf.polygon([
      [
        [yOffsetC, xOffsetB],
        [yOffsetC, yOffsetAux],
        [(yOffsetC + yOffsetD) / 2, xOffsetA],
        [yOffsetD, yOffsetAux],
        [yOffsetD, xOffsetB],
        [yOffsetC, xOffsetB],
      ],
    ]);

    geojson = turf.toWgs84(polygon);

    let distance = turf.rhumbDistance([0, 0], ship.location.coordinates, {
      units: "meters",
    });

    let bearing = turf.rhumbBearing([0, 0], ship.location.coordinates);

    geojson = turf.transformTranslate(geojson, distance, bearing, {
      units: "meters",
    });

    geojson = turf.transformRotate(geojson, turf.bearingToAzimuth(hdg), {
      pivot: ship.location.coordinates,
    });
  }

  var options = { tolerance: 0.000001, highQuality: true };
  var simplified = turf.simplify(geojson, options);

  let result = {
    type: "Feature",
    properties: {
      _id: ship._id,
      mmsi: ship.mmsi,
      shipname: ship.shipname,
      cargo: ship.cargo,
      hdg: ship.hdg,
      utc: ship.utc,
    },
    geometry: simplified.geometry,
  };

  return { _id: ship._id, location: ship.location, geojson: result };
}

// Define the startDispatchLoop function
async function startDispatchLoop() {
  if (dispatchTimeout) {
    clearTimeout(dispatchTimeout);
  }

  let currentLength = messageQueue.length;
  let chunk = messageQueue.splice(0, NUMBER_OF_EMITS);

  logInfo(
    `Dispatching \x1b[32m${chunk.length}\x1b[0m. Remaining: \x1b[31m${
      currentLength - chunk.length
    }\x1b[0m`
  );

  // Dispatch the messages
  for (let i = 0; i < chunk.length; i++) {
    let key = chunk[i];
    let message = messages.get(key);
    if (!message) continue;
    message = processShipData(message);
    await emitMessage(message);
    messages.delete(key);
  }

  // Schedule the next dispatch loop
  dispatchTimeout = setTimeout(startDispatchLoop.bind(this), TIMEOUT_LOOP);
}

function processShipData(ship) {
  const [x, y] = ship.location.coordinates;
  const hdg = ship?.hdg; // Heading of the ship

  let geojson;

  if (!hdg || hdg === 511) {
    const length = ship?.dimA + ship?.dimB || ship.length || 20; // Length of the ship
    const width = ship?.dimC + ship?.dimD || ship.width || 20; // Width of the ship

    // Draw a circle if hdg is null or 511
    const radius = Math.max(width, length) / 2;
    geojson = turf.circle([x, y], radius, { units: "meters" });
  } else {
    const length = ship?.dimA + ship?.dimB || ship.length || 50; // Length of the ship
    const width = ship?.dimC + ship?.dimD || ship.width || 20; // Width of the ship

    // Calculate the offsets in degrees
    const xOffsetA = ship?.dimA || length / 2;
    const xOffsetB = -(ship?.dimB || length / 2);
    const yOffsetC = -(ship?.dimC || width / 2);
    const yOffsetD = ship?.dimD || width / 2;

    const yOffsetAux = xOffsetA - 10;

    // Create a polygon with a "beak" and rotate it according to the heading
    const polygon = turf.polygon([
      [
        [yOffsetC, xOffsetB],
        [yOffsetC, yOffsetAux],
        [(yOffsetC + yOffsetD) / 2, xOffsetA],
        [yOffsetD, yOffsetAux],
        [yOffsetD, xOffsetB],
        [yOffsetC, xOffsetB],
      ],
    ]);

    geojson = turf.toWgs84(polygon);

    let distance = turf.rhumbDistance([0, 0], ship.location.coordinates, {
      units: "meters",
    });

    let bearing = turf.rhumbBearing([0, 0], ship.location.coordinates);

    geojson = turf.transformTranslate(geojson, distance, bearing, {
      units: "meters",
    });

    geojson = turf.transformRotate(geojson, turf.bearingToAzimuth(hdg), {
      pivot: ship.location.coordinates,
    });
  }

  ship.geojson = {
    type: "Feature",
    properties: {
      _id: ship._id,
      location: ship.location,
      ...ship,
    },
    geometry: geojson.geometry,
  };

  return ship;
}

// Define the emitMessage function
function emitMessage(msg) {
  return new Promise((resolve) => {
    io.sockets.emit("message", msg, () => {
      resolve();
    });
  });
}

// Start the application
connectToMongoDBWithRetry();
