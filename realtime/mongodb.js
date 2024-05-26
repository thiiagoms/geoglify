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
async function searchAISShips(page, itemsPerPage, searchText, cargos = [], featureCollection = null) {
  let match = {};

  if (searchText) {
    match.$or = [{ mmsi: { $regex: searchText, $options: "i" } }, { shipname: { $regex: searchText, $options: "i" } }, { imo: { $regex: searchText, $options: "i" } }];
  }

  if (cargos.length > 0) {
    match.cargo = { $in: cargos };
  } else {
    return { items: [], total: 0 };
  }

  if (featureCollection) {
    match.location = {
      $geoIntersects: {
        $geometry: featureCollection,
      },
    };
  }

  let pipeline = [
    {
      $project: {
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
      },
    },
    { $match: match },
    { $skip: (page - 1) * itemsPerPage },
    { $limit: itemsPerPage },
  ];

  let ships = await mongoClient.db("geoglify").collection("realtime").aggregate(pipeline).toArray();

  let countPipeline = [{ $match: match }, { $count: "total" }];

  let countResult = await mongoClient.db("geoglify").collection("realtime").aggregate(countPipeline).toArray();

  let total = countResult.length > 0 ? countResult[0].total : 0;

  return { items: ships, total: total };
}

// Get a ship by ID
async function getAISShip(shipId) {
  return await mongoClient
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
}

module.exports = {
  getAISShips,
  getAISShip,
  searchAISShips,
};
