require("dotenv").config();

// Import the necessary libraries
const { MongoClient } = require("mongodb");
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const turf = require("@turf/turf");

// Create a MongoDB client instance using the connection string provided in the environment variables
const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);

// Create an Express app and a HTTP server
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origins: [process.env.SOCKET_CORS_ORIGIN] },
});

// Create a route to handle the root URL
const clients = new Map();
let messages = new Map();
const messageQueue = [];
const NUMBER_OF_EMITS = 50;
const TIMEOUT_LOOP = 1000;
let dispatchTimeout = null;

app.use(cors());

app.get("/", (_, res) => {
  res.json("Geoglify Realtime API");
});

server.listen(8080, () => {
  console.log("Listening on *:8080");
});

// Define the connectWithRetry function
async function connectWithRetry() {
  try {
    await client.connect();
    console.info(
      "[" +
        new Date().toLocaleString("en-GB", { timeZone: "UTC" }) +
        "] MongoDB Connected"
    );
    await run();
  } catch (err) {
    console.info(
      "[" +
        new Date().toLocaleString("en-GB", { timeZone: "UTC" }) +
        "] Failed to connect to MongoDB, retrying..."
    );
    setTimeout(connectWithRetry, 5000);
  }
}

// Define the run function
async function run() {
  try {
    // Connect to the "geoglify" database and the "realtime" collection
    const database = client.db("geoglify");
    const realtimeMessagesCollection = database.collection("realtime");

    io.on("connection", (socket) => {
      clients.set(socket.id, socket);
      socket.on("disconnect", () => clients.delete(socket.id));
    });

    const options = { fullDocument: "updateLookup" };
    const changeStream = realtimeMessagesCollection.watch([], options);

    // Listen for changes on the "realtime" collection
    changeStream.on("change", async (change) => {
      let ship = change.fullDocument;

      let message = {
        _id: ship._id,
        mmsi: ship.mmsi,
        name: ship.name,
        flag_country_name: ship.flag_country_name,
        flag_country_code: ship.flag_country_code,
        cargo_type_code: ship.cargo_type_code,
        hdg: ship.hdg,
        location: ship.location,
        time_utc: ship.time_utc,
        eta: ship.eta,
      };

      messages.set(ship.mmsi, message);

      if (message && !messageQueue.includes(message.mmsi)) {
        messageQueue.push(message.mmsi);
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

  console.info(
    "[" +
      new Date().toLocaleString("en-GB", { timeZone: "UTC" }) +
      "] " +
      `Dispatch ` +
      chunk.length +
      " of " +
      current_length +
      " messages"
  );

  // Dispatch the messages
  for (let i = 0; i < chunk.length; i++) {
    let key = chunk[i];
    let message = messages.get(key);
    if(!message) continue;
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
      const length =
        ship?.dimension?.A + ship?.dimension?.B || ship.loa || ship.lbp || 20; // Length of the ship
      const width =
        ship?.dimension?.C + ship?.dimension?.D ||
        ship.hull_beam ||
        ship.breadth_moulded ||
        20; // Width of the ship

      // Draw a circle if hdg is null or 511
      const radius = Math.max(width, length) / 2;
      geojson = turf.circle([x, y], radius, { units: "meters" });
    } else {
      const length = ship.loa || ship.lbp || 50; // Length of the ship
      const width = ship.hull_beam || ship.breadth_moulded || 20; // Width of the ship

      // Calculate the offsets in degrees
      const xOffsetA = ship?.dimension?.A || length / 2; 100
      const xOffsetB = -(ship?.dimension?.B || length / 2);
      const yOffsetC = -(ship?.dimension?.C || width / 2);
      const yOffsetD = ship?.dimension?.D || width / 2;

      const yOffsetAux = (xOffsetA * 0.9);

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

connectWithRetry();
