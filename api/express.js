const express = require("express");
const http = require("http");
const cors = require("cors");
const { getAISShips, getAISShip, searchAISShips, getLayers, insertLayer, getLayerById, updateLayer, deleteLayer, getFeaturesByLayerId, insertFeature, updateLayerStyle, getWmsLayers, insertWmsLayer, getWmsLayerById, updateWmsLayer, deleteWmsLayer } = require("./mongodb");

const app = express();
const server = http.createServer(app);

app.use(express.json({ limit: "100mb" }));
app.use(cors());

// Default route
app.get("/", (_, res) => {
  res.json("Geoglify API");
});

app.get("/ships", async (_, res) => {
  const ships = await getAISShips();
  res.json(ships);
});

app.get("/ship/:id", async (req, res) => {
  const _id = req.params.id;
  const ais_ship = await getAISShip(_id);
  res.json(ais_ship);
});

app.post("/ships/search", async (req, res) => {
  const page = parseInt(req.body.page) || 1;
  const itemsPerPage = parseInt(req.body.itemsPerPage) || 20;
  const searchText = req.body.searchText || "";
  const ships = await searchAISShips(page, itemsPerPage, searchText);
  res.json(ships);
});

module.exports = { app, server };
