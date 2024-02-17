const { MongoClient } = require("mongodb");
const express = require("express");
const http = require("http");
const cors = require("cors");
const { ObjectId } = require("mongodb"); // Importing ObjectId correctly

require("dotenv").config();

const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);

const app = express();
const server = http.createServer(app);

app.use(express.json({ limit: "100mb" }));
app.use(cors());

app.get("/", (_, res) => {
  res.json("Geoglify API");
});

app.get("/ais_ships", async (_, res) => {
  const ais_ships = await getAISShips();
  res.json(ais_ships);
});

app.get("/layers", async (_, res) => {
  const layers = await getLayers();
  res.json(layers);
});

app.post("/layers", async (req, res) => {
  const { code, name, description, type, features } = req.body; // Assuming features are present in req.body

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
    fillPatternScale: 1, // Default fill pattern scale
    fillPatternOffset: [0, 0], // Default fill pattern offset
  };

  const insertedLayer = await insertLayer(newLayer);

  // If layer insertion is successful, add features to the features table
  if (insertedLayer) {
    const layerId = insertedLayer._id; // Assuming _id is the identifier for layers

    // Inserting features with associated layer_id
    await Promise.all(
      features.map(async (feature) => {
        feature.layer_id = layerId; // Adding layer_id to each feature
        return await insertFeature(layerId, feature); // Inserting feature into the features table
      })
    );

    newLayer.features = features;

    // Sending response
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

  const updatedLayer = await updateLayer(layerId, { code, name, description, type });
  
  // Clear all features for the layer and insert the new ones only if features are present in the request and has a length greater than 0
  if (updatedLayer && features && features.length > 0) {

    const layerId = updatedLayer._id; // Assuming _id is the identifier for layers

    await client
      .db("geoglify")
      .collection("features")
      .deleteMany({ layer_id: new ObjectId(layerId) });

    // Inserting features with associated layer_id
    await Promise.all(
      features.map(async (feature) => {
        feature.layer_id = layerId; // Adding layer_id to each feature
        return await insertFeature(layerId, feature); // Inserting feature into the features table
      })
    );

    updatedLayer.features = features;
  }

  // Sending response
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

async function startServer() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    server.listen(8081, () => {
      console.log("Listening on *:8081");
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

startServer();

async function getAISShips() {
  const result = await client.db("geoglify").collection("ais").find().toArray();
  return result;
}

async function getLayers() {
  const result = await client
    .db("geoglify")
    .collection("layers")
    .find()
    .toArray();
  return result;
}

async function insertLayer(layer) {
  const result = await client
    .db("geoglify")
    .collection("layers")
    .insertOne(layer);

  const insertedId = result.insertedId;

  const insertedLayer = await client
    .db("geoglify")
    .collection("layers")
    .findOne({ _id: insertedId });

  return insertedLayer;
}

async function getLayerById(layerId) {
  const result = await client
    .db("geoglify")
    .collection("layers")
    .findOne({ _id: new ObjectId(layerId) });
  return result;
}

async function updateLayer(layerId, updatedLayer) {
  await client
    .db("geoglify")
    .collection("layers")
    .updateOne({ _id: new ObjectId(layerId) }, { $set: updatedLayer });

  const result = await client
    .db("geoglify")
    .collection("layers")
    .findOne({ _id: new ObjectId(layerId) });

  return result;
}

async function deleteLayer(layerId) {
  const result = await client
    .db("geoglify")
    .collection("layers")
    .deleteOne({ _id: new ObjectId(layerId) });
  return result.deletedCount;
}

async function getFeaturesByLayerId(layerId) {
  const result = await client
    .db("geoglify")
    .collection("features")
    .find({ layer_id: new ObjectId(layerId) })
    .toArray();
  return result;
}

async function insertFeature(layerId, feature) {
  feature.layer_id = layerId;
  const result = await client
    .db("geoglify")
    .collection("features")
    .insertOne(feature);

  return result;
}

async function updateLayerStyle(layerId, newStyle) {
  const result = await client
    .db("geoglify")
    .collection("layers")
    .updateOne({ _id: new ObjectId(layerId) }, { $set: { style: newStyle } });
  return result.modifiedCount;
}
