import { defineStore } from "pinia";

export const layersStore = defineStore("layersStore", {
  state: () => ({
    layerList: new Map(),
    selectedFeature: null,
    isLoading: false,
    searchText: "",
    isNavigationDrawerOpen: false,
    layerIdToView: null,
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
        const { _id, name, code, description, features, style, type } = layer;
        return { _id, name, code, description, features, style, type };
      });

      return formattedList;
    },
  },

  actions: {
    // Fetch layers from the server
    async fetchLayers() {
      this.isLoading = true;
      try {
        const { data } = await useFetch(`${this.getRequestBaseURL()}/layers`);

        let layers = toRaw(data.value);

        layers.forEach((layer) => {
          // Add the "features" property as an empty array
          layer.features = [];
          this.createOrReplaceLayer(layer);
        });

        this.isLoading = false;

        console.info(`Layers list successfully retrieved`);
      } catch (error) {
        console.error(`Error fetching layers list`, error);

        this.isLoading = false;
      }
    },

    // Create or replace a layer in the list
    createOrReplaceLayer(layer) {
      layer.isLoading = false;
      layer.isActive = false;
      this.layerList.set(layer._id, layer);
    },

    // Set the selected feature
    setSelectedFeature(feature) {
      this.selectedFeature = feature;
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
        await fetch(`${this.getRequestBaseURL()}/layers/${layerId}`, {
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
        await fetch(`${this.getRequestBaseURL()}/layers/${updatedLayer._id}`, {
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
        const { data } = await useFetch(`${this.getRequestBaseURL()}/layers`, {
          method: "POST",
          body: JSON.stringify(newLayer),
          headers: {
            "Content-Type": "application/json",
          },
        });

        let layer = toRaw(data.value);
        layer.isActive = true;
        this.layerList.set(layer._id, layer);
        console.info("Layer created successfully");
      } catch (error) {
        console.error(`Error creating layer`, error);
      }
    },

    // CRUD operations for features of a specific layer
    // Fetch features for a given layer from the server
    async fetchFeaturesByLayer(layerId) {
      try {
        this.setStateLoadingLayer(layerId, true);

        const { data } = await useFetch(
          `${this.getRequestBaseURL()}/layers/${layerId}/features`
        );

        const layer = this.layerList.get(layerId);
        layer.features = toRaw(data.value);
        this.layerList.set(layerId, layer);

        this.setStateLoadingLayer(layerId, false);

        console.info(`Features for layer ${layerId} successfully retrieved`);
      } catch (error) {
        console.error(`Error fetching features for layer ${layerId}`, error);
      }
    },

    async getFeaturesDetailsByLayer(layerId) {
      try {
        const { data } = await useFetch(
          `${this.getRequestBaseURL()}/layers/${layerId}/features`
        );
        return toRaw(data.value).map((feature) => {
          let properties = feature.properties;
          let orderedProperties = { id: feature._id, ...properties };
          return orderedProperties;
        });
      } catch (error) {
        console.error(`Error fetching features for layer ${layerId}`, error);
      }
    },

    // Define the clearFeaturesForLayer method
    clearFeaturesForLayer(layerId) {
      const layer = this.layerList.get(layerId);
      if (layer) {
        layer.features = [];
        this.layerList.set(layerId, layer);
      } else {
        console.error(`Layer ${layerId} not found for feature clearing`);
      }
    },

    // Update the style of a layer
    async updateLayerStyle(layerId, newStyle) {
      try {
        await fetch(`${this.getRequestBaseURL()}/layers/${layerId}/style`, {
          method: "PUT",
          body: JSON.stringify(newStyle),
          headers: {
            "Content-Type": "application/json",
          },
        });

        const layer = this.layerList.get(layerId);
        layer.style = newStyle;
        this.layerList.set(layerId, layer);

        console.info("Layer style updated successfully");
      } catch (error) {
        console.error(`Error updating layer style`, error);
      }
    },

    getRequestBaseURL() {
      return useRuntimeConfig().public.API_URL;
    },
  },
});
