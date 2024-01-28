// Import necessary modules and libraries
import configs from "@/helpers/configs";
import { defineStore } from "pinia";

// Define the shipsStore using Pinia
export const shipsStore = defineStore("shipsStore", {
  // Define the initial state of the store
  state: () => ({
    list: new Map(),
    selected: null,
    loading: false,
  }),

  // Define the actions for interacting with the state
  actions: {
    // Action to fetch ships from MongoDB
    async fetchShips() {

      const timestamp = new Date().toLocaleString("en-GB", {
        timeZone: "UTC",
      });

      try {

        console.info(`[${timestamp}] Fetching ships list from MongoDB...`);

        this.loading = true;

        const { data } = await useFetch("http://localhost:8080/ships");

        let ships = toRaw(data.value);

        ships.forEach((ship) => {
          this.createOrReplace(ship);
        });

        this.loading = false;

        console.info(`[${timestamp}] Ships list successfully retrieved`);
      } catch (error) {
        console.error(`[${timestamp}] Error fetching ships list`, error);

        this.loading = false;
      }
    },

    // Action to create or replace a ship in the list
    createOrReplace(ship) {
      // Process ship data before storing it
      this.list.set(ship._id, this.processData(ship));
    },

    // Action to process ship data
    processData(ship) {
      // Extract relevant properties from the ship object
      const { hdg, cargo_type } = ship;

      // Check if heading is valid
      const isHeadingValid = hdg && hdg !== 511;

      // Determine ship icon, size, and priority based on heading validity
      ship.icon = isHeadingValid ? "models/boat.png" : "models/circle.png";
      ship.size = 22;
      ship.priority = isHeadingValid ? 1 : -1;

      // Get ship type from configs based on cargo type
      const type = configs.getShipType(cargo_type);

      // Set ship color, type, and update priority
      ship.color = configs.hexToRgb(type.color);
      ship.type = type;
      ship.priority += type.priority ?? 0;

      // Return the processed ship object
      return ship;
    },

    // Action to set the selected ship
    setSelected(ship) {
      this.selected = ship;
    },
  },
});
