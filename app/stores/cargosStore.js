// Import necessary modules and libraries
import configs from "@/helpers/configs";
import { defineStore } from "pinia";

// Define the cargosStore using Pinia
export const cargosStore = defineStore("cargosStore", {
  // Define the initial state of the store
  state: () => ({
    cargosList: configs.getCategories(),
    selectedCargos: [],
    isLoading: false,
    isNavigationDrawerOpen: false,
  }),

  getters: {
    filteredList(state) {
      return this.cargosList;
    },
  },
  // Define the actions for interacting with the state
  actions: {
    // Action to set navigation drawer state
    setNavigationDrawerState(state) {
      this.isNavigationDrawerOpen = state;
    },

    // Toggle navigation drawer state
    toggleNavigationDrawerState() {
      this.isNavigationDrawerOpen = !this.isNavigationDrawerOpen;
    },
  },
});
