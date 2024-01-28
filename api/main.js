// Import the dotenv library to load environment variables from a .env file
require("dotenv").config();

// Import the necessary libraries
const { MongoClient } = require("mongodb");
const express = require("express");
const http = require("http");
const cors = require("cors");

// Create a MongoDB client instance using the connection string provided in the environment variables
const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);

const app = express();
const server = http.createServer(app);

let layers = [
  {
    _id: 1,
    name: "Points",
    type: "points",
    geojson:
      '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"name":"Ponto 1"},"geometry":{"type":"Point","coordinates":[-46.6333,-23.5505]}},{"type":"Feature","properties":{"name":"Ponto 2"},"geometry":{"type":"Point","coordinates":[0,0]}}]}',
  },
  {
    _id: 2,
    name: "Lines",
    type: "lines",
    geojson:
      '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"name":"Linha 1"},"geometry":{"type":"LineString","coordinates":[[-46.6333,-23.5505],[0,0]]}}]}',
  },
  {
    _id: 3,
    name: "Polygons",
    type: "polygons",
    geojson:
      '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"name":"Polígono 1"},"geometry":{"type":"Polygon","coordinates":[[[-46.6333,-23.5505],[0,0],[-46.6333,-23.5505]]]}}]}',
  },
  {
    _id: 4,
    name: "Points",
    type: "points",
    geojson:
      '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"name":"Ponto 1"},"geometry":{"type":"Point","coordinates":[-46.6333,-23.5505]}},{"type":"Feature","properties":{"name":"Ponto 2"},"geometry":{"type":"Point","coordinates":[0,0]}}]}',
  },
  {
    _id: 5,
    name: "Lines",
    type: "lines",
    geojson:
      '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"name":"Linha 1"},"geometry":{"type":"LineString","coordinates":[[-46.6333,-23.5505],[0,0]]}}]}',
  },
  {
    _id: 6,
    name: "Polygons",
    type: "polygons",
    geojson:
      '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"name":"Polígono 1"},"geometry":{"type":"Polygon","coordinates":[[[-46.6333,-23.5505],[0,0],[-46.6333,-23.5505]]]}}]}',
  },
  {
    _id: 7,
    name: "Points",
    type: "points",
    geojson:
      '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"name":"Ponto 1"},"geometry":{"type":"Point","coordinates":[-46.6333,-23.5505]}},{"type":"Feature","properties":{"name":"Ponto 2"},"geometry":{"type":"Point","coordinates":[0,0]}}]}',
  },
  {
    _id: 8,
    name: "Lines",
    type: "lines",
    geojson:
      '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"name":"Linha 1"},"geometry":{"type":"LineString","coordinates":[[-46.6333,-23.5505],[0,0]]}}]}',
  },
  {
    _id: 9,
    name: "Polygons",
    type: "polygons",
    geojson:
      '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"name":"Polígono 1"},"geometry":{"type":"Polygon","coordinates":[[[-46.6333,-23.5505],[0,0],[-46.6333,-23.5505]]]}}]}',
  },
  {
    _id: 10,
    name: "Points",
    type: "points",
    geojson:
      '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"name":"Ponto 1"},"geometry":{"type":"Point","coordinates":[-46.6333,-23.5505]}},{"type":"Feature","properties":{"name":"Ponto 2"},"geometry":{"type":"Point","coordinates":[0,0]}}]}',
  },
  {
    _id: 11,
    name: "Lines",
    type: "lines",
    geojson:
      '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"name":"Linha 1"},"geometry":{"type":"LineString","coordinates":[[-46.6333,-23.5505],[0,0]]}}]}',
  },
  {
    _id: 12,
    name: "Polygons",
    type: "polygons",
    geojson:
      '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"name":"Polígono 1"},"geometry":{"type":"Polygon","coordinates":[[[-46.6333,-23.5505],[0,0],[-46.6333,-23.5505]]]}}]}',
  },
  {
    _id: 13,
    name: "Points",
    type: "points",
    geojson:
      '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"name":"Ponto 1"},"geometry":{"type":"Point","coordinates":[-46.6333,-23.5505]}},{"type":"Feature","properties":{"name":"Ponto 2"},"geometry":{"type":"Point","coordinates":[0,0]}}]}',
  },
  {
    _id: 14,
    name: "Lines",
    type: "lines",
    geojson:
      '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"name":"Linha 1"},"geometry":{"type":"LineString","coordinates":[[-46.6333,-23.5505],[0,0]]}}]}',
  },
  {
    _id: 15,
    name: "Polygons",
    type: "polygons",
    geojson:
      '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"name":"Polígono 1"},"geometry":{"type":"Polygon","coordinates":[[[-46.6333,-23.5505],[0,0],[-46.6333,-23.5505]]]}}]}',
  },
];

app.use(cors());

// Create a route to handle the root URL
app.get("/", (_, res) => {
  res.json("Geoglify API");
});

// Create a route to handle the root URL
app.get("/layers", (_, res) => {
  // Return layers as JSON response
  res.json(layers);
});

// Start the server on port 8081
server.listen(8081, () => {
  console.log("Listening on *:8081");
});
