import { defineStore } from "pinia";

export const wmsLayersStore = defineStore("wmsLayersStore", {
  state: () => ({
    layerList: new Map(),
    isLoading: false,
    searchText: "",
    isNavigationDrawerOpen: false,
    layerIdToView: null
  }),

  getters: {
    // Filtered list of layers based on name, code, or description
    filteredList(state) {
      const list = Array.from(state.layerList.values()).filter((layer) => {
        const { name, code, description } = layer;
        const searchTextLower = state.searchText
          ? state.searchText.toLowerCase()
          : "";

        return (
          (name && name.toLowerCase().includes(searchTextLower)) ||
          (code && code.toLowerCase().includes(searchTextLower)) ||
          (description && description.toLowerCase().includes(searchTextLower))
        );
      });

      // Return a list with the filtered layers
      return new Map(list.map((layer) => [layer._id, layer]));
    },

    // Getter to get a list of active layers with specific properties
    activeLayersList(state) {
      const activeLayers = Array.from(state.layerList.values()).filter(
        (layer) => {
          return layer.isActive;
        }
      );

      const formattedList = activeLayers.map((layer) => {
        const { _id, name, code, description, url, layers } = layer;
        return { _id, name, code, description, url, layers };
      });

      return formattedList;
    },
  },

  actions: {
    // Fetch layers from the server
    async fetchLayers() {
      this.isLoading = true;
      try {
        const { data } = await useFetch(`${this.getRequestBaseURL()}/wmslayers`);

        let layers = toRaw(data.value);

        layers.forEach((layer) => {
          this.createOrReplaceLayer(layer);
        });

        this.isLoading = false;

        console.info(`Wms Layers list successfully retrieved`);
      } catch (error) {
        console.error(`Error fetching wms layers list`, error);

        this.isLoading = false;
      }
    },

    // Create or replace a layer in the list
    createOrReplaceLayer(layer) {
      layer.isLoading = false;
      layer.isActive = false;
      this.layerList.set(layer._id, layer);
    },

    // Set navigation drawer state
    setNavigationDrawerState(state) {
      this.isNavigationDrawerOpen = state;
    },

    // Set the layer features view id
    setLayerIdToView(layerId) {
      this.layerIdToView = layerId;
    },

    // Toggle navigation drawer state
    toggleNavigationDrawerState() {
      this.isNavigationDrawerOpen = !this.isNavigationDrawerOpen;
    },

    setStateLoadingLayer(layerId, isLoading) {
      const layer = this.layerList.get(layerId);
      if (layer) {
        layer.isLoading = isLoading;
        this.layerList.set(layerId, layer);
      }
    },

    // Create a new layer
    async deleteLayer(layerId) {
      try {
        await fetch(`${this.getRequestBaseURL()}/wmslayers/${layerId}`, {
          method: "DELETE",
        });
        this.layerList.delete(layerId);
      } catch (error) {
        console.error(`Error deleting layer`, error);
      }
    },

    // Update an existing layer
    async updateLayer(updatedLayer) {
      try {
        await fetch(`${this.getRequestBaseURL()}/wmslayers/${updatedLayer._id}`, {
          method: "PUT",
          body: JSON.stringify(updatedLayer),
          headers: {
            "Content-Type": "application/json",
          },
        });

        this.layerList.set(updatedLayer._id, updatedLayer);
        console.info("Layer updated successfully");
      } catch (error) {
        console.error(`Error updating layer`, error);
      }
    },

    // Create a new layer
    async createLayer(newLayer) {
      try {
        const { data } = await useFetch(`${this.getRequestBaseURL()}/wmslayers`, {
          method: "POST",
          body: JSON.stringify(newLayer),
          headers: {
            "Content-Type": "application/json",
          },
        });

        let layer = toRaw(data.value);
        layer.isActive = true;
        this.layerList.set(layer._id, layer);
        console.info("Wms Layer created successfully");
      } catch (error) {
        console.error(`Error creating wms layer`, error);
      }
    },

    getRequestBaseURL() {
      return useRuntimeConfig().public.API_URL;
    },
  },
});
