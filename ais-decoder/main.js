const net = require("net");
const { AisDecode, NmeaDecode } = require("ggencoder");
const axios = require("axios");

// Configurations via environment variables
const HOST = process.env.AIS_ANTENNA_HOST || ""; // AIS server host
const PORT = process.env.AIS_ANTENNA_PORT || 0; // AIS server port
const API_URL = process.env.API_URL || "http://localhost:81/api/ships"; // API endpoint
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE) || 10; // Batch size for sending data
const SEND_INTERVAL = parseInt(process.env.SEND_INTERVAL) || 1000; // Send interval in milliseconds (1 second)
const MAX_RECONNECT_ATTEMPTS =
  parseInt(process.env.MAX_RECONNECT_ATTEMPTS) || 10; // Maximum reconnection attempts

// State variables
let reconnectAttempts = 0; // Reconnection attempt counter
const eventQueue = []; // Event queue for batch processing
const client = new net.Socket(); // TCP client for AIS server connection
const session = {}; // Session for NMEA message decoding

// Connect to the AIS server
function connectToAisAntenna() {
  client.connect(PORT, HOST, () => {
    console.log(`Connected to AIS antenna at ${HOST}:${PORT}`);
    reconnectAttempts = 0; // Reset reconnection attempts on successful connection
  });
}

// Decode AIS/NMEA message
function decodeMessage(rawMessage) {
  // Remove the initial metadata (e.g., \s:2573565,c:1737227486*06\)
  const aisPayload = rawMessage.split("\\")[2]; // Extract the part after the second backslash

  // Decode the AIS payload
  let decMsg = new AisDecode(aisPayload, {});

  if (decMsg.valid) {
    const shipData = decodeStreamMessage(decMsg);
    queueEvent(shipData);
    return;
  }

  // If not a valid AIS message, try decoding as NMEA
  decMsg = new NmeaDecode(aisPayload, session);
  if (decMsg.valid) {
    const shipData = decodeStreamMessage(decMsg);
    queueEvent(shipData);
    return;
  }

  console.error("Invalid NMEA message:", aisPayload);
}

// Structure the decoded message into a ship data object
function decodeStreamMessage(message) {
  return {
    mmsi: message.mmsi?.toString() || null, // Ship's MMSI
    name: message.shipname || "", // Ship's name
    last_updated: new Date(), // Current timestamp
    location: {
      type: "Point",
      coordinates: [message.lon, message.lat], // Longitude and Latitude
    },
    cog: message.cog || null, // Course Over Ground
    sog: message.sog || null, // Speed Over Ground
    hdg: message.hdg === 511 ? null : message.hdg, // Heading (511 means "not available")
    dim_a: message.dimA || null, // Dimension A
    dim_b: message.dimB || null, // Dimension B
    dim_c: message.dimC || null, // Dimension C
    dim_d: message.dimD || null, // Dimension D
    imo: message.imo || null, // IMO number
    destination: message.destination || null, // Destination
    cargo: message.cargo || null, // Cargo type
    callsign: message.callsign || null, // Call sign
    draught: message.draught || null, // Draught
    eta:
      message.etaDay && message.etaHr && message.etaMin
        ? `${message.etaDay}/${message.etaMo} ${message.etaHr}:${message.etaMin}`
        : null, // Estimated Time of Arrival
    navstatus: message.navstatus || null, // Navigation status
    rot: message.rot || null, // Rate of Turn
    length: message.length || null, // Ship length
    width: message.width || null, // Ship width
    aistype: message.aistype || null, // AIS message type
    repeat: message.repeat || null, // Repeat indicator
    channel: message.channel || null, // Communication channel
    utc: message.utc || null, // UTC timestamp
    smi: message.smi || null, // Ship and Mobile Identifier
  };
}

// Add an event to the queue, replacing existing events for the same MMSI
function queueEvent(event) {
  const existingEventIndex = eventQueue.findIndex((e) => e.mmsi === event.mmsi);

  if (existingEventIndex !== -1) {
    eventQueue[existingEventIndex] = event; // Replace existing event
  } else {
    eventQueue.push(event); // Add new event
  }
}

// Send data to the API in batches
async function flushEvents() {
  if (eventQueue.length === 0) return;

  const chunk = eventQueue.slice(0, BATCH_SIZE); // Extract a batch from the queue

  console.log(
    `Sending ${chunk.length} of ${eventQueue.length} ships to the API...`
  );

  try {
    const response = await axios.post(API_URL, chunk, {
      headers: { "Content-Type": "application/json" },
    });
    console.info(
      `Sent ${chunk.length} of ${eventQueue.length} ships to the API. Status: ${response.status}`
    );

    // Remove the sent chunk from the queue only if the API request is successful
    eventQueue.splice(0, chunk.length);
  } catch (error) {
    console.error("Failed to send ships to the API:", error.message);
    // Do not clear the queue on failure; retry in the next interval
  }
}

// Configure periodic sending of data
setInterval(flushEvents, SEND_INTERVAL);

// TCP client events
client.on("data", (data) => {
  const message = data.toString().trim();
  decodeMessage(message);
});

client.on("close", () => {
  console.error("Connection to AIS antenna closed, reconnecting...");
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    setTimeout(() => {
      reconnectAttempts++;
      connectToAisAntenna();
    }, 5000);
  } else {
    console.error(
      "Max reconnection attempts reached. Please check the AIS antenna connection."
    );
  }
});

client.on("error", (err) => {
  console.error("AIS antenna connection error:", err.message);
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    setTimeout(() => {
      reconnectAttempts++;
      connectToAisAntenna();
    }, 5000);
  } else {
    console.error(
      "Max reconnection attempts reached. Please check the AIS antenna connection."
    );
  }
});

// Initial connection to the AIS server
connectToAisAntenna();
