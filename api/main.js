// Imports
const { MongoClient } = require("mongodb");
const express = require("express");
const http = require("http");
const cors = require("cors");
const { ObjectId } = require("mongodb");
const turf = require("@turf/turf");

// MongoDB Client
const MONGODB_CONNECTION_STRING =
  process.env.MONGODB_CONNECTION_STRING ||
  "mongodb://root:root@localhost:27778/?directConnection=true&authMechanism=DEFAULT";
const mongoClient = new MongoClient(MONGODB_CONNECTION_STRING);

// Express App Setup
const app = express();
const server = http.createServer(app);
app.use(express.json({ limit: "100mb" }));
app.use(cors());

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

// Routes

// Default route
app.get("/", (_, res) => {
  res.json("Geoglify API");
});

app.get("/ais_ships", async (_, res) => {
  const ais_ships = await getAISShips();
  res.json(ais_ships);
});

app.get("/ais_ships/:id", async (req, res) => {
  const _id = req.params.id;
  const ais_ship = await mongoClient
    .db("geoglify")
    .collection("realtime")
    .findOne(
      { _id: new ObjectId(_id) },
      {
        projection: {
          _id: 1,
          mmsi: 1,
          ais_server_host: 1,
          aistype: 1,
          callsign: 1,
          cargo: 1,
          channel: 1,
          class: 1,
          dimA: 1,
          dimB: 1,
          dimC: 1,
          dimD: 1,
          length: 1,
          utc: 1,
          width: 1,
          cog: 1,
          hdg: 1,
          sog: 1,
          shipname: 1,
        },
      }
    );
  res.json(ais_ship);
});

// Layers Routes
app.get("/layers", async (_, res) => {
  const layers = await getLayers();
  res.json(layers);
});

app.post("/layers", async (req, res) => {
  const { code, name, description, type, features } = req.body;

  // Inserting the new layer
  const newLayer = { code, name, description, type };

  // Add default style to the new layer
  newLayer.style = {
    radius: 6, // Default radius
    lineWidth: 5, // Default border size
    fillColor: "#DF950D", // Default fill color
    lineColor: "#000000ff", // Default Line Color
    dashArray: "0,0", // Default dash array
    fillPattern: "none", // Default fill pattern
    fillPatternScale: 100, // Default fill pattern scale
    fillPatternOffset: [0, 0], // Default fill pattern offset
  };

  const insertedLayer = await insertLayer(newLayer);

  // If layer insertion is successful, add features to the features table
  if (insertedLayer) {
    // Inserting features with associated layer_id
    await Promise.all(
      features.map(async (feature) => {
        return await insertFeature(insertedLayer._id, feature);
      })
    );
    newLayer.features = features;
    res.json(newLayer);
  } else {
    res.status(500).json({ error: "Failed to insert layer" });
  }
});

app.get("/layers/:id", async (req, res) => {
  const layerId = req.params.id;
  const layer = await getLayerById(layerId);
  res.json(layer);
});

app.put("/layers/:id", async (req, res) => {
  const layerId = req.params.id;
  const { code, name, description, type, features } = req.body;

  const updatedLayer = await updateLayer(layerId, {
    code,
    name,
    description,
    type,
  });

  // Clear all features for the layer and insert the new ones only if features are present in the request and has a length greater than 0
  if (updatedLayer && features && features.length > 0) {
    await client
      .db("geoglify")
      .collection("features")
      .deleteMany({ layer_id: new ObjectId(layerId) });
    await Promise.all(
      features.map(async (feature) => {
        return await insertFeature(layerId, feature);
      })
    );
    updatedLayer.features = features;
  }
  res.json(updatedLayer);
});

app.delete("/layers/:id", async (req, res) => {
  const layerId = req.params.id;
  const result = await deleteLayer(layerId);
  res.json(result);
});

app.get("/layers/:layerId/features", async (req, res) => {
  const layerId = req.params.layerId;
  const features = await getFeaturesByLayerId(layerId);
  res.json(features);
});

app.put("/layers/:id/style", async (req, res) => {
  const layerId = req.params.id;
  const newStyle = req.body;
  const result = await updateLayerStyle(layerId, newStyle);
  res.json(result);
});

// WMS Layers Routes
app.get("/wmslayers", async (_, res) => {
  const layers = await getWmsLayers();
  res.json(layers);
});

app.post("/wmslayers", async (req, res) => {
  const { code, name, description, url, layers } = req.body;
  const newLayer = { code, name, description, url, layers };
  const insertedLayer = await insertWmsLayer(newLayer);
  res.json(insertedLayer);
});

app.get("/wmslayers/:id", async (req, res) => {
  const layerId = req.params.id;
  const layer = await getWmsLayerById(layerId);
  res.json(layer);
});

app.put("/wmslayers/:id", async (req, res) => {
  const layerId = req.params.id;
  const { code, name, description, url, layers } = req.body;
  const updatedLayer = await updateWmsLayer(layerId, {
    code,
    name,
    description,
    url,
    layers,
  });
  res.json(updatedLayer);
});

app.delete("/wmslayers/:id", async (req, res) => {
  const layerId = req.params.id;
  const result = await deleteWmsLayer(layerId);
  res.json(result);
});

// Database Operations Functions
async function getAISShips() {
  const results = await mongoClient
    .db("geoglify")
    .collection("realtime")
    .find(
      {},
      {
        projection: {
          _id: 1,
          mmsi: 1,
          shipname: 1,
          cargo: 1,
          hdg: 1,
          location: 1,
          utc: 1
        },
      }
    )
    .limit(10000)
    .toArray();

  return results.map((ship) => processShipData(ship));
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
      utc: ship.utc
    },
    geometry: simplified.geometry,
  };

  return { _id: ship._id, location: ship.location, geojson: result };
}

async function getLayers() {
  const result = await mongoClient
    .db("geoglify")
    .collection("layers")
    .find()
    .toArray();
  return result;
}

async function insertLayer(layer) {
  const result = await mongoClient
    .db("geoglify")
    .collection("layers")
    .insertOne(layer);

  const insertedId = result.insertedId;

  const insertedLayer = await mongoClient
    .db("geoglify")
    .collection("layers")
    .findOne({ _id: insertedId });

  return insertedLayer;
}

async function getLayerById(layerId) {
  const result = await mongoClient
    .db("geoglify")
    .collection("layers")
    .findOne({ _id: new ObjectId(layerId) });
  return result;
}

async function updateLayer(layerId, updatedLayer) {
  await mongoClient
    .db("geoglify")
    .collection("layers")
    .updateOne({ _id: new ObjectId(layerId) }, { $set: updatedLayer });

  const result = await mongoClient
    .db("geoglify")
    .collection("layers")
    .findOne({ _id: new ObjectId(layerId) });

  return result;
}

async function deleteLayer(layerId) {
  const result = await mongoClient
    .db("geoglify")
    .collection("layers")
    .deleteOne({ _id: new ObjectId(layerId) });
  return result.deletedCount;
}

async function getFeaturesByLayerId(layerId) {
  const result = await mongoClient
    .db("geoglify")
    .collection("features")
    .find({ layer_id: new ObjectId(layerId) })
    .toArray();
  return result;
}

async function insertFeature(layerId, feature) {
  feature.layer_id = layerId;
  const result = await mongoClient
    .db("geoglify")
    .collection("features")
    .insertOne(feature);

  return result;
}

async function updateLayerStyle(layerId, newStyle) {
  const result = await mongoClient
    .db("geoglify")
    .collection("layers")
    .updateOne({ _id: new ObjectId(layerId) }, { $set: { style: newStyle } });
  return result.modifiedCount;
}

async function getWmsLayers() {
  const result = await mongoClient
    .db("geoglify")
    .collection("wmslayers")
    .find()
    .toArray();
  return result;
}

async function insertWmsLayer(layer) {
  const result = await mongoClient
    .db("geoglify")
    .collection("wmslayers")
    .insertOne(layer);

  const insertedId = result.insertedId;

  const insertedLayer = await mongoClient
    .db("geoglify")
    .collection("wmslayers")
    .findOne({ _id: insertedId });

  return insertedLayer;
}

async function getWmsLayerById(layerId) {
  const result = await mongoClient
    .db("geoglify")
    .collection("wmslayers")
    .findOne({ _id: new ObjectId(layerId) });
  return result;
}

async function updateWmsLayer(layerId, updatedLayer) {
  await mongoClient
    .db("geoglify")
    .collection("wmslayers")
    .updateOne({ _id: new ObjectId(layerId) }, { $set: updatedLayer });

  const result = await mongoClient
    .db("geoglify")
    .collection("wmslayers")
    .findOne({ _id: new ObjectId(layerId) });

  return result;
}

async function deleteWmsLayer(layerId) {
  const result = await mongoClient
    .db("geoglify")
    .collection("wmslayers")
    .deleteOne({ _id: new ObjectId(layerId) });
  return result.deletedCount;
}

// Server Start
async function connectToMongoDBWithRetry() {
  try {
    logWarning("Connecting to MongoDB...");
    await mongoClient.connect();
    logSuccess("MongoDB Connected");
    server.listen(8081, () => {
      logSuccess("Server running on port 8081");
    });
  } catch (err) {
    logError("Failed to connect to MongoDB, retrying...");
    setTimeout(connectToMongoDBWithRetry, 5000);
  }
}

connectToMongoDBWithRetry();
