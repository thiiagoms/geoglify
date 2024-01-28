// Import necessary modules and libraries
import { defineStore } from "pinia";

// Define the layersStore using Pinia
export const layersStore = defineStore("layersStore", {
  // Define the initial state of the store
  state: () => ({
    list: new Map(),
    selected: null,
    loading: false,
  }),

  // Define the actions for interacting with the state
  actions: {
    // Action to fetch layers from MongoDB
    async fetchLayers() {

      const timestamp = new Date().toLocaleString("en-GB", {
        timeZone: "UTC",
      });

      try {

        console.info(`[${timestamp}] Fetching layers list from MongoDB...`);

        this.loading = true;

        const { data } = await useFetch("http://localhost:8081/layers");

        let layers = toRaw(data.value);

        layers.forEach((layer) => {
          this.createOrReplace(layer);
        });

        this.loading = false;

        console.info(`[${timestamp}] Ships list successfully retrieved`);
        
      } catch (error) {

        console.error(`[${timestamp}] Error fetching layers list`, error);

        this.loading = false;
      }
    },

    // Action to create or replace a layer in the list
    createOrReplace(layer) {
      // Process layer data before storing it
      this.list.set(layer._id, this.processData(layer));
    },

    // Action to process layer data
    processData(layer) {
      // Return the processed layer object
      return layer;
    },

    // Action to set the selected layer
    setSelected(layer) {
      this.selected = layer;
    },
  },
});
