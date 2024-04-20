// Import necessary modules and libraries
import configs from "@/helpers/configs";
import * as turf from "@turf/turf";

export const state = () => ({
  list: [],
  selected: null,
  selectedDetails: null,
  selectedCargos: configs.getCargos(),
  listOpened: false,
});

export const actions = {
  // Action to fetch the ship list
  async FETCH({ commit }) {
    return new Promise(async (resolve) => {
      const ships = await $fetch("/api/ships");
      commit("createOrReplace", ships);
      resolve(ships);
    });
  },

  // Action to create or replace the ship list
  async CREATE_OR_REPLACE({ commit }, ships) {
    commit("createOrReplace", ships);
  },

  // Action to set the selected ship
  async SET_SELECTED({ commit }, ship) {
    return new Promise(async (resolve) => {
      if (ship?._id) {
        const data = await $fetch("/api/ship/" + ship?._id);
        data.countryCode = configs.getCountryCode(data.mmsi);
        commit("setSelectedShip", data);
        resolve();
      } else {
        commit("setSelectedShip", null);
        resolve();
      }
    });
  },

  // Action to search for ships
  async SEARCH(_, payload) {
    return new Promise(async (resolve) => {
      // Fetch the search results from the server
      const results = await $fetch("/api/ships/search", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // Process the ship data and add country code
      results.items = results.items.map((ship) => {
        ship.countrycode = configs.getCountryCode(ship.mmsi);
        return ship;
      });

      // Resolve the promise with the search results
      resolve(results);
    });
  },
};

export const mutations = {
  // Action to set the selected ship
  setSelectedShip(state, ship) {
    state.selected = ship;
  },

  // Action to create or replace the ship list
  createOrReplace(state, ships) {
    // Check if ships is a valid array
    if (!Array.isArray(ships)) {
      state.list = [];
    }

    // Process ship data and filter out invalid entries
    const processedShips = ships.map(processShipData).filter(Boolean);

    // Create a copy of the existing ship list to avoid direct mutations
    const list = [...state.list];

    // Update or add new ships to the ship list
    processedShips.forEach((newShip) => {
      const index = list.findIndex((ship) => ship._id === newShip._id);
      if (index !== -1) {
        list[index] = newShip; // Replace existing ship
      } else {
        list.push(newShip); // Add new ship
      }
    });

    state.list = list;
  },
};

function processShipData(ship) {
  const { hdg, cargo, mmsi } = ship;

  const isHeadingValid = !!(hdg && hdg !== 511);

  if (isHeadingValid) {
    ship.icon = "models/boat.svg";
    ship.size = 22;
    ship.width = 41;
    ship.height = 96;
  } else {
    ship.icon = "models/circle.png";
    ship.size = 10;
    ship.width = 20;
    ship.height = 20;
  }

  const cargoType = configs.getCargoType(cargo);

  ship.color = configs.hexToRgb(cargoType.color);
  ship.priority = -(isHeadingValid ? cargoType.priority * -100 : -100);

  if (!!mmsi) ship.countrycode = configs.getCountryCode(mmsi);

  ship.geojson = processShipGeoJson(ship);

  return ship;
}

function processShipGeoJson(ship) {
  try {
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

      let distance = turf.rhumbDistance([0, 0], ship.location.coordinates, { units: "meters" });
      let bearing = turf.rhumbBearing([0, 0], ship.location.coordinates);

      geojson = turf.transformTranslate(geojson, distance, bearing, { units: "meters" });
      geojson = turf.transformRotate(geojson, turf.bearingToAzimuth(hdg), { pivot: ship.location.coordinates });
    }

    let result = {
      type: "Feature",
      properties: { _id: ship._id, color: ship.color },
      geometry: geojson.geometry,
    };

    return result;
  } catch (error) {
    return null;
  }
}
