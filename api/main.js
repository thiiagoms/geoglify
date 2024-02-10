// Import the dotenv library to load environment variables from a .env file
require("dotenv").config();

// Import the necessary libraries
const { MongoClient, ObjectId } = require("mongodb");
const express = require("express");
const http = require("http");
const cors = require("cors");

// Create a MongoDB client instance using the connection string provided in the environment variables
const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cors());

// Create a route to handle the root URL
app.get("/", (_, res) => {
  res.json("Geoglify API");
});

app.get("/ais_ships", async (_, res) => {
  const ais_ships = await getAISShips();
  res.json(ais_ships);
});

// CRUD operations for layers
app.get("/layers", async (_, res) => {
  const layers = await getLayers();
  res.json(layers);
});

app.post("/layers", async (req, res) => {
  const { code, name, description, style } = req.body;
  const newLayer = { code, name, description, style };

  const result = await insertLayer(newLayer);
  res.json(result);
});

app.get("/layers/:id", async (req, res) => {
  const layerId = req.params.id;
  const layer = await getLayerById(layerId);
  res.json(layer);
});

app.put("/layers/:id", async (req, res) => {
  const layerId = req.params.id;
  const updatedLayer = req.body;

  const result = await updateLayer(layerId, updatedLayer);
  res.json(result);
});

app.delete("/layers/:id", async (req, res) => {
  const layerId = req.params.id;
  const result = await deleteLayer(layerId);
  res.json(result);
});

// CRUD operations for features of a specific layer
app.get("/layers/:layerId/features", async (req, res) => {
  const layerId = req.params.layerId;
  const features = await getFeaturesByLayerId(layerId);
  res.json(features);
});

app.post("/layers/:layerId/features", async (req, res) => {
  const layerId = req.params.layerId;
  const newFeature = req.body;

  const result = await insertFeature(layerId, newFeature);
  res.json(result);
});

app.get("/layers/:layerId/features/:featureId", async (req, res) => {
  const { layerId, featureId } = req.params;
  const feature = await getFeatureById(layerId, featureId);
  res.json(feature);
});

app.put("/layers/:layerId/features/:featureId", async (req, res) => {
  const { layerId, featureId } = req.params;
  const updatedFeature = req.body;

  const result = await updateFeature(layerId, featureId, updatedFeature);
  res.json(result);
});

app.delete("/layers/:layerId/features/:featureId", async (req, res) => {
  const { layerId, featureId } = req.params;
  const result = await deleteFeature(layerId, featureId);
  res.json(result);
});

// Start the server
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

// Helper functions for CRUD operations
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
  return result;
}

async function getLayerById(layerId) {
  const result = await client
    .db("geoglify")
    .collection("layers")
    .findOne({ _id: ObjectId(layerId) });
  return result;
}

async function updateLayer(layerId, updatedLayer) {
  const result = await client
    .db("geoglify")
    .collection("layers")
    .updateOne({ _id: ObjectId(layerId) }, { $set: updatedLayer });
  return result.modifiedCount;
}

async function deleteLayer(layerId) {
  const result = await client
    .db("geoglify")
    .collection("layers")
    .deleteOne({ _id: ObjectId(layerId) });
  return result.deletedCount;
}

async function getFeaturesByLayerId(layerId) {
  const result = await client
    .db("geoglify")
    .collection("features")
    .find({ layer_id: layerId })
    .toArray();
  return result;
}

async function insertFeature(layerId, feature) {
  feature.layer_id = layerId;
  const result = await client
    .db("geoglify")
    .collection("features")
    .insertOne(feature);
  return result.ops[0];
}

async function getFeatureById(layerId, featureId) {
  const result = await client
    .db("geoglify")
    .collection("features")
    .findOne({
      _id: ObjectId(featureId),
      layer_id: layerId,
    });
  return result;
}

async function updateFeature(layerId, featureId, updatedFeature) {
  const result = await client
    .db("geoglify")
    .collection("features")
    .updateOne(
      { _id: ObjectId(featureId), layer_id: layerId },
      { $set: updatedFeature }
    );
  return result.modifiedCount;
}

async function deleteFeature(layerId, featureId) {
  const result = await client
    .db("geoglify")
    .collection("features")
    .deleteOne({
      _id: ObjectId(featureId),
      layer_id: layerId,
    });
  return result.deletedCount;
}
