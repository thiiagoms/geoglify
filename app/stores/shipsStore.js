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
        const { name, mmsi, flag_country_name } = ship;
        const searchTextLower = state.searchText
          ? state.searchText.toLowerCase()
          : "";

        return (
          ((name && name.toLowerCase().includes(searchTextLower)) ||
            (mmsi && mmsi.toString().includes(searchTextLower)) ||
            (flag_country_name &&
              flag_country_name.toLowerCase().includes(searchTextLower))) &&
          state.selectedCargos.some(
            (cargo) => cargo.code === (ship.cargo_type_code ?? 0)
          )
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

      let ship = data.value;

      if (!!ship) {
        this.selectedShipDetails = {
          MMSI: ship.mmsi,
          IMO: ship.imo,
          Name: ship.name,
          "SOG (º)": ship.sog,
          "COG (º)": ship.cog,
          "HDG (º)": ship.hdg,
          "Width (m)": ship?.dimension?.A + ship?.dimension?.B || "N/A",
          "Length (m)": ship?.dimension?.C + ship?.dimension?.D || "N/A",
          "LOA (m)": ship.loa || null,
          "LBP (m)": ship.lbp || null,
          "Deadweight (metric tons)": ship.deadweight,
          "Breadth Moulded (m)": ship.breadth_moulded,
          "Hull Beam (m)": ship.hull_beam,
          GT: ship.gt,
          NT: ship.nt,
          "Call Sign": ship.call_sign,
          "Construction Date": ship.construction_date,
          "Maximum Draught (m)": ship.maximum_draught,
          "Ship Cargo": ship.cargo_name,
          "Registry Country": ship.registry_country_name,
          "Flag Country": ship.flag_country_name,
          "Ship Owner": ship.ship_owner_name,
          "Management Company": ship.management_company_name,
          Destination: ship.destination,
          ETA: ship.eta,
          "Latest Report": ship.time_utc,
        };
      }

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
      let newShipList = [...this.shipList]; // Create a copy of the existing ship array

      ships.forEach((newShip) => {
        // Check if the ship object is valid
        if (!newShip || !newShip._id) {
          console.error(`Invalid ship object`, newShip);
          return;
        }

        // Check if a ship with the same ID already exists in the list
        const existingShipIndex = newShipList.findIndex(
          (ship) => ship._id === newShip._id
        );

        if (existingShipIndex !== -1) {
          // If the ship already exists, replace it in the list
          newShipList[existingShipIndex] = this.processShipData(newShip);
        } else {
          // If the ship doesn't exist, add it to the list
          newShipList.push(this.processShipData(newShip));
        }
      });

      // Update the ship list with the new list
      this.shipList = newShipList;
    },

    // Action to process ship data
    processShipData(ship) {
      // Extract relevant properties from the ship object
      const { hdg, cargo_type_code, dimension } = ship;

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
      const cargoType = configs.getCargoType(cargo_type_code);

      // Set ship color, type, and update priority
      ship.color = configs.hexToRgb(cargoType.color);
      ship.cargo_code = cargoType.code;
      ship.cargo_name = cargoType.name;

      ship.priority = isHeadingValid ? cargoType.priority * -100 : -1000;

      //invert signal priority
      ship.priority = -ship.priority;
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
