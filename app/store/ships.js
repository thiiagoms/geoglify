// Import necessary modules and libraries
import configs from "@/helpers/configs";

export const state = () => ({
  list: [],
  selected: null,
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

  async GET_HISTORY(_, payload) {
    const config = useRuntimeConfig();

    return new Promise(async (resolve) => {
      try {
        const ships = await $fetch(config.public.EXP_API_URL + "/history/" + payload.timestamp);
        resolve(ships);
      } catch (error) {
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
    const processedShips = ships.map((s) => configs.processShipData(s)).filter(Boolean);

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
