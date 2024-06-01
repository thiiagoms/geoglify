// Import necessary modules and libraries
import configs from "@/helpers/configs";

export const state = () => ({
  list: [],
  selected: null,
  selectedPath: null,
  selectedDetails: null,
  cargos: configs.getCargos(),
  listOpened: false,
});

export const actions = {

  // Action to fetch the ship list
  async FETCH({ commit, dispatch }) {
    const config = useRuntimeConfig();

    return new Promise(async (resolve) => {
      try {
        const ships = await $fetch(config.public.EXP_API_URL + "/ships");

        dispatch("PROCESS_ALL", ships);

        resolve();
      } catch (error) {
        commit("createOrReplace", []);
        resolve([]);
      }
    });
  },

  async PROCESS_ALL({ dispatch }, ships) {
    for (let i = 0; i < ships.length; i += 100) {
      let chunk = ships.slice(i, i + 100);
      await dispatch("CREATE_OR_REPLACE", chunk);
    }
  },

  // Action to create or replace the ship list
  async CREATE_OR_REPLACE({ commit }, ships) {
    return new Promise(async (resolve) => {
      commit("createOrReplace", ships);
      setTimeout(() => {
        resolve();
      }, 10);
    });
  },

  // Action to set the selected ship
  async SET_SELECTED({ commit }, ship) {
    return new Promise(async (resolve) => {
      const config = useRuntimeConfig();

      if (ship?._id) {
        const data = await $fetch(config.public.EXP_API_URL + "/ship/" + ship?._id);
        data.countrycode = configs.getCountryCode(data.mmsi);
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
      const config = useRuntimeConfig();

      try {
        // Fetch the search results from the server
        const results = await $fetch(config.public.EXP_API_URL + "/ships/search", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        // Process the ship data and add country code
        if (!results.items) return resolve([]);

        results.items = results.items.map((ship) => {
          ship.countrycode = configs.getCountryCode(ship.mmsi);
          return ship;
        });

        // Resolve the promise with the search results
        resolve(results);
      } catch (error) {
        resolve([]);
      }
    });
  },

  SET_SELECTED_PATH({ commit }, value) {
    commit("setSelectedPath", value);
  },

};

export const mutations = {

  // Action to set the selected path
  setSelectedPath(state, value) {
    state.selectedPath = value;
  },

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

    // State mutation to update the ship list
    state.list = [...list];
  },
};

// Process the ship data and return the processed ship object
function processShipData(ship) {
  // Check if the ship object is valid
  if (!ship || !ship.location || !ship.location.coordinates) return null;

  // Extract the necessary data from the ship object
  const { hdg, cargo, mmsi } = ship;

  // Check if the heading is valid
  const isHeadingValid = !!(hdg && hdg !== 511);

  // Create a new ship object with the necessary properties
  if (isHeadingValid) {
    ship.icon = "models/boat.svg";
    ship.size = 16;
    ship.width = 44;
    ship.height = 96;
  } else {
    ship.icon = "models/circle.svg";
    ship.size = 10;
    ship.width = 20;
    ship.height = 20;
  }

  // Determine the color and priority of the ship based on the cargo type
  const cargoType = configs.getCargoType(cargo);
  ship.color = configs.hexToRgb(cargoType.color, 1);
  ship.colorGeoJson = configs.hexToRgb(cargoType.color, 0.8);
  ship.priority = -(isHeadingValid ? cargoType.priority * -100 : -100);

  // Get the country code from the MMSI
  if (!!mmsi) ship.countrycode = configs.getCountryCode(mmsi);

  // Process the GeoJSON data
  ship.geojson = configs.processGeoJSON(ship);

  return ship;
}
