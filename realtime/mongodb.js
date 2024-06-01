// Description: MongoDB operations for Geoglify API.
const { MongoClient } = require("mongodb");
const { ObjectId } = require("mongodb");

// MongoDB Connection String
const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || "mongodb://root:root@localhost:27778/?directConnection=true&authMechanism=DEFAULT";
const mongoClient = new MongoClient(MONGODB_CONNECTION_STRING);

// Get the list of ships
async function getAISShips() {
  const results = await mongoClient
    .db("geoglify")
    .collection("realtime")
    .find(
      {},
      /*{
        $and: [
          { lat: { $exists: true, $ne: null, $ne: 0 } }, // lat exists and is not null nor zero
          { lon: { $exists: true, $ne: null, $ne: 0 } }, // lon exists and is not null nor zero
        ],
      },*/
      {
        projection: {
          _id: 1,
          mmsi: 1,
          shipname: 1,
          cargo: 1,
          hdg: 1,
          location: 1,
          utc: 1,
          lat: 1,
          lon: 1,
          dimA: 1,
          dimB: 1,
          dimC: 1,
          dimD: 1,
          length: 1,
          width: 1,
        },
      }
    )
    .limit(30000)
    .toArray();

  return results;
}

// Search for ships
async function searchAISShips(page, itemsPerPage, searchText, cargos = [], geometry = null) {
  let match = {};

  if (searchText) {
    match.$or = [{ mmsi: { $regex: searchText, $options: "i" } }, { shipname: { $regex: searchText, $options: "i" } }, { imo: { $regex: searchText, $options: "i" } }];
  }

  if (cargos.length > 0) {
    match.cargo = { $in: cargos };
  } else {
    return { items: [], total: 0 };
  }

  if (geometry) {
    match.location = {
      $geoIntersects: {
        $geometry: geometry,
      },
    };
  }

  let project = {
    _id: 1,
    mmsi: 1,
    shipname: 1,
    cargo: { $ifNull: ["$cargo", 0] },
    hdg: 1,
    location: 1,
    utc: 1,
    lat: 1,
    lon: 1,
    dimA: 1,
    dimB: 1,
    dimC: 1,
    dimD: 1,
    length: 1,
    width: 1,
  };

  let pipeline = [
    {
      $project: project,
    },
    { $match: match },
    { $skip: (page - 1) * itemsPerPage },
    { $limit: itemsPerPage },
  ];

  let countPipeline = [{ $project: project }, { $match: match }, { $count: "total" }];

  let ships = await mongoClient.db("geoglify").collection("realtime").aggregate(pipeline).toArray();

  let countResult = await mongoClient.db("geoglify").collection("realtime").aggregate(countPipeline).toArray();

  let total = countResult.length > 0 ? countResult[0].total : 0;

  return { items: ships, total: total };
}

// Get a ship by ID
async function getAISShip(shipId) {
  let data = await mongoClient
    .db("geoglify")
    .collection("realtime")
    .findOne(
      { _id: new ObjectId(shipId) },
      {
        projection: {
          _id: 1,
          mmsi: 1,
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
          lat: 1,
          lon: 1,
        },
      }
    );

  data.path = await getHistoricalPath(data.mmsi);
  return data;
}

async function getHistoricalPath(mmsi) {
  let data = await mongoClient
    .db("geoglify")
    .collection("historical")
    .find(
      { mmsi: mmsi },
      {
        projection: {
          _id: 0,  // Exclude the _id field from the projection
          location: 1,
        },
      }
    )
    .toArray();

  // Extract coordinates from each location point
  return data.map((d) => d.location.coordinates);
}

module.exports = {
  getAISShips,
  getAISShip,
  searchAISShips,
  getHistoricalPath,
};
