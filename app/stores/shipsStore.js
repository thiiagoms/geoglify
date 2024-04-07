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
        const { shipname, mmsi, cargo } = ship.geojson.properties;
        const searchTextLower = state.searchText
          ? state.searchText.toLowerCase()
          : "";

        return (
          ((shipname && shipname.toLowerCase().includes(searchTextLower)) ||
            (mmsi && mmsi.toString().includes(searchTextLower))) &&
          state.selectedCargos.some((c) => c.code === (cargo ?? 0))
        );
      });

      // return list with the filtered ships
      return Object.freeze(list);
    },
  },

  // Define the actions for interacting with the state
  actions: {
    // Action to fetch ships from MongoDB
    async fetchShips() {
      this.isLoading = true;

      const { data } = await useFetch(this.getRequestBaseURL() + "/ais_ships");

      if (data.value) {
        let ships = data.value;
        this.createOrReplaceShips(ships);
      }

      this.isLoading = false;
    },

    async fetchShipDetails(id) {
      if (!id) {
        this.selectedShipDetails = null;
        return;
      }

      this.isShipLoading = true;

      const { data } = await useFetch(
        this.getRequestBaseURL() + "/ais_ships/" + id
      );

      this.selectedShipDetails = data.value;

      //add flag country code to the ship details
      if (this.selectedShipDetails && this.selectedShipDetails.mmsi)
        this.selectedShipDetails.countrycode = configs.getCountryCode(
          this.selectedShipDetails.mmsi
        );

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

    // Action to create or replace a ship in the list
    createOrReplaceShips(ships) {
      let newShipList = []; // Create a copy of the existing ship array

      ships.forEach((newShip) => {
        // Check if the ship object is valid
        if (!newShip || !newShip._id) {
          console.error(`Invalid ship object`, newShip);
          return;
        }

        newShipList.push(this.processShipData(newShip));
      });

      // Create a map of new ships for faster lookup
      const newShipMap = new Map(newShipList.map((ship) => [ship._id, ship]));

      // Update the ships in shipList with the same _id as in newShipList and hdg or cargo has changed
      this.shipList = this.shipList.map((ship) => {
        // If a new ship with the same _id is found and hdg or cargo has changed, replace the ship with the new ship
        if (newShipMap.has(ship._id)) {
          const newShip = newShipMap.get(ship._id);
          if (newShip.hdg !== ship.hdg || newShip.cargo !== ship.cargo) {
            return newShip;
          }
        }

        // If no new ship with the same _id is found or hdg and cargo haven't changed, keep the original ship
        return ship;
      });

      // Add new ships from newShipList that don't exist in shipList
      newShipList.forEach((newShip) => {
        if (!this.shipList.find((ship) => ship._id === newShip._id)) {
          this.shipList.push(newShip);
        }
      });
    },

    // Action to process ship data
    processShipData(ship) {
      // Extract relevant properties from the ship object
      const { hdg, cargo, mmsi } = ship.geojson.properties;

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
      ship.geojson.properties.color = configs.hexToRgb(cargoType.color);
      ship.geojson.properties.priority = -(isHeadingValid
        ? cargoType.priority * -100
        : -1000);

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
      return useRuntimeConfig().public.API_URL;
    },
  },
});
