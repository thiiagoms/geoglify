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
    isLoading: false,
    isShipLoading: false,
    searchText: "",
    isNavigationDrawerOpen: false,
  }),

  getters: {
    filteredList(state) {
      const list = state.shipList.filter((ship) => {
        const { shipname, mmsi, cargo } = ship;
        const searchTextLower = state.searchText ? state.searchText.toLowerCase() : "";
        return ((shipname && shipname.toLowerCase().includes(searchTextLower)) || (mmsi && mmsi.toString().includes(searchTextLower))) && state.selectedCargos.some((c) => c.code === (cargo ?? 0));
      });

      // return list with the filtered ships
      return Object.freeze(list);
    },
  },

  // Define the actions for interacting with the state
  actions: {
    async fetchShips() {
      this.isLoading = true;

      try {
        const ships = await $fetch("/api/ships");

        if (ships) {
          await this.createOrReplaceShips(ships);
          console.log(`Processed ${ships.length} ships`);
        }
      } catch (error) {
        // Handle errors appropriately
        console.error("Error fetching ships:", error);
      } finally {
        this.isLoading = false;
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

      this.isShipLoading = true;

      const data = await $fetch("/api/ship/" + id);

      this.selectedShipDetails = data;

      //add flag country code to the ship details
      if (this.selectedShipDetails && this.selectedShipDetails.mmsi) this.selectedShipDetails.countrycode = configs.getCountryCode(this.selectedShipDetails.mmsi);

      this.isShipLoading = false;
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
          if (!ships || !Array.isArray(ships)) {
            resolve(); // Resolves the promise if ships is invalid
          }

          const processedShips = ships
            .map((newShip) => {
              // Check if the ship object is valid
              if (!newShip || !newShip._id) {
                console.error(`Invalid ship object`, newShip);
                return null; // Return null for invalid ships
              }
              return this.processShipData(newShip);
            })
            .filter((ship) => ship !== null); // Remove null entries

          this.shipList = processedShips; // Replace the ship list with the processed ships

          resolve(); // Resolves the promise when finished
        } catch (error) {
          console.error("Error creating or replacing ships:", error);
          reject(error); // Rejects the promise if an error occurs
        }
      });
    },

    // Action to process ship data
    processShipData(ship) {
      // Extract relevant properties from the ship object
      const { hdg, cargo, mmsi } = ship;

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

    // Toggle navigation drawer state
    toggleNavigationDrawerState() {
      this.isNavigationDrawerOpen = !this.isNavigationDrawerOpen;
    },

    getRequestBaseURL() {
      return useRuntimeConfig().API_URL + "/api";
    },
  },
});
