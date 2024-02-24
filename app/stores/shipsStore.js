// Import necessary modules and libraries
import configs from "@/helpers/configs";
import { defineStore } from "pinia";

// Define the shipsStore using Pinia
export const shipsStore = defineStore("shipsStore", {
  // Define the initial state of the store
  state: () => ({
    shipList: new Map(),
    selectedShip: null,
    isLoading: false,
    searchText: "",
    isNavigationDrawerOpen: false,
  }),

  getters: {
    filteredList(state) {
      const list = Array.from(state.shipList.values()).filter((ship) => {
        const { name, mmsi, cargo } = ship;
        const searchTextLower = state.searchText
          ? state.searchText.toLowerCase()
          : "";

        return (
          (name && name.toLowerCase().includes(searchTextLower)) ||
          (mmsi && mmsi.toString().includes(searchTextLower)) ||
          (cargo && cargo.toString().includes(searchTextLower))
        );
      });

      // return list with the filtered ships
      return new Map(list.map((ship) => [ship._id, ship]));
    },
  },

  // Define the actions for interacting with the state
  actions: {
    // Action to fetch ships from MongoDB
    async fetchShips() {
      this.isLoading = true;
    
      try {
        const { data } = await useFetch(
          this.getRequestBaseURL() + "/ais_ships"
        );
    
        if (!data || !data.value) {
          throw new Error("API response is invalid");
        }
    
        let ships = toRaw(data.value);
    
        ships.forEach((ship) => {
          this.createOrReplaceShip(ship);
        });
    
        this.isLoading = false;
  
        return ships;
      } catch (error) {
        this.isLoading = false;
        throw error;
      }
    },
    

    // Action to create or replace a ship in the list
    createOrReplaceShip(ship) {
      // Check if the ship object is valid
      if (!ship || !ship._id) {
        console.error(`Invalid ship object`, ship);
        return;
      }
      // Process ship data before storing it
      this.shipList.set(ship._id, this.processShipData(ship));
    },

    // Action to process ship data
    processShipData(ship) {
      // Extract relevant properties from the ship object
      const { hdg, cargo_code } = ship;

      // Check if heading is valid
      const isHeadingValid = !!(hdg && hdg !== 511);

      // Determine ship icon, size, and priority based on heading validity
      ship.icon = isHeadingValid ? "models/boat.png" : "models/circle.png";
      ship.size = isHeadingValid ? 22 : 10;
      ship.priority = isHeadingValid ? 1 : -1;
      ship.width = isHeadingValid ? 41 : 20;
      ship.height = isHeadingValid ? 96 : 20;

      // Get ship type from configs based on cargo type
      const shipType = configs.getShipType(cargo_code);
      if (!ship.cargo) ship.cargo = shipType.name;

      // Set ship color, type, and update priority
      ship.color = configs.hexToRgb(shipType.color);
      ship.priority += shipType.priority ?? 0;

      // Return the processed ship object
      return ship;
    },

    // Action to set the selected ship
    setSelectedShip(ship) {
      this.selectedShip = ship;
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
      return useRuntimeConfig().public.API_URL;
    },
  },
});
