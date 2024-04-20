// Import necessary modules and libraries
import configs from "@/helpers/configs";
import { defineStore } from "pinia";

// Define the shipsStore using Pinia
export const shipsStore = defineStore("shipsStore", {
  // Define the initial state of the store
  state: () => ({
    shipList: [],
    selectedShip: null,
    selectedShipDetails: null,
    selectedCargos: configs.getCargos(),
    isNavigationDrawerOpen: false,
  }),

  getters: {
    filteredList(state) {
      return state.shipList.filter((ship) => !!ship.location);
      //@todo: filter by cargo;
    },
  },

  // Define the actions for interacting with the state
  actions: {
    async fetchShips() {
      try {
        // Fetch ships from the API
        const ships = await $fetch("/api/ships");
        await this.createOrReplaceShips(ships);
      } catch (error) {
        console.error("Error fetching ships:", error);
      }
    },

    async searchShips(payload) {
      try {
        const results = await $fetch("/api/ships/search", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        results.items = results.items.map((ship) => {
          ship.countrycode = configs.getCountryCode(ship.mmsi);
          return ship;
        });

        return results;
      } catch (error) {
        // Handle errors appropriately
        console.error("Error search ships:", error);
      }
    },

    async fetchShipDetails(id) {
      if (!id) {
        this.selectedShipDetails = null;
        return;
      }

      const data = await $fetch("/api/ship/" + id);

      this.selectedShipDetails = data;

      //add flag country code to the ship details
      if (this.selectedShipDetails && this.selectedShipDetails.mmsi) this.selectedShipDetails.countrycode = configs.getCountryCode(this.selectedShipDetails.mmsi);
    },

    updateCargoActiveState(cargo, state) {
      const index = this.selectedCargos.findIndex((c) => c.code === cargo.code);
      if (state && index === -1) {
        this.selectedCargos.push(cargo);
      } else if (!state && index !== -1) {
        this.selectedCargos.splice(index, 1);
      }
    },

    createOrReplaceShips(ships) {
      return new Promise((resolve, reject) => {
        try {
          if (!Array.isArray(ships)) {
            resolve(); // Resolve the promise if ships is not a valid array
            return;
          }

          // Process ship data and filter out invalid entries
          const processedShips = ships.map(this.processShipData.bind(this)).filter(Boolean);

          // Create a copy of the existing ship list to avoid direct mutations
          const shipList = [...this.shipList];

          // Update or add new ships to the ship list
          processedShips.forEach((newShip) => {
            const index = shipList.findIndex((ship) => ship._id === newShip._id);
            if (index !== -1) {
              shipList[index] = newShip; // Replace existing ship
            } else {
              shipList.push(newShip); // Add new ship
            }
          });

          this.shipList = shipList;

          resolve(); // Resolve the promise when finished
        } catch (error) {
          console.error("Error creating or replacing ships:", error);
          reject(error); // Reject the promise if an error occurs
        }
      });
    },

    // Action to process ship data
    processShipData(ship) {
      // Extract relevant properties from the ship object
      const { hdg, cargo, mmsi } = ship;

      if(!ship.location) console.log('no location', ship);

      // Check if heading is valid
      const isHeadingValid = !!(hdg && hdg !== 511);

      // Determine ship icon, size, and priority based on heading validity
      if (isHeadingValid) {
        ship.icon = "models/boat.png";
        ship.size = 22;
        ship.width = 41;
        ship.height = 96;
      } else {
        ship.icon = "models/circle.png";
        ship.size = 10;
        ship.width = 20;
        ship.height = 20;
      }

      // Get cargo type from configs based on cargo type ais
      const cargoType = configs.getCargoType(cargo);

      // Set ship color and priority based on cargo type
      ship.color = configs.hexToRgb(cargoType.color);
      ship.priority = -(isHeadingValid ? cargoType.priority * -100 : -1000);

      //add flag country code to the ship details
      if (!!mmsi) ship.countrycode = configs.getCountryCode(mmsi);

      return ship;
    },

    // Action to set the selected ship
    setSelectedShip(ship) {
      this.selectedShip = ship;
      if (ship?._id) this.fetchShipDetails(ship?._id);
    },

    // Action to set navigation drawer state
    setNavigationDrawerState(state) {
      this.isNavigationDrawerOpen = state;
    },

    getRequestBaseURL() {
      return useRuntimeConfig().API_URL + "/api";
    },
  },
});
