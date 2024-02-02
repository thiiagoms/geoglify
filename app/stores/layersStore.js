import { defineStore } from "pinia";

export const layersStore = defineStore("layersStore", {
  state: () => ({
    layerList: new Map(),
    selected: null,
    isLoading: false,
    searchText: "",
    isNavigationDrawerOpen: false,
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
        const { _id, name, code, description, features, style } = layer;
        return { _id, name, code, description, features, style };
      });

      return formattedList;
    },
  },

  actions: {
    // Fetch layers from the server
    async fetchLayers() {
      this.isLoading = true;
      try {
        const { data } = await useFetch("http://localhost:8081/layers");

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
      this.layerList.set(layer._id, layer);
    },

    // Set the selected layer
    setSelectedLayer(layer) {
      this.selected = layer;
    },

    // Set navigation drawer state
    setNavigationDrawerState(state) {
      this.isNavigationDrawerOpen = state;
    },

    // Toggle navigation drawer state
    toggleNavigationDrawerState() {
      this.isNavigationDrawerOpen = !this.isNavigationDrawerOpen;
    },

    // Create a new layer
    async createLayer(newLayer) {
      try {
        const response = await useFetch("http://localhost:8081/layers", {
          method: "POST",
          body: JSON.stringify(newLayer),
          headers: {
            "Content-Type": "application/json",
          },
        });

        const createdLayer = await response.json();
        // Add the "features" property as an empty array
        createdLayer.features = [];
        this.createOrReplaceLayer(createdLayer);

        console.info(`Layer created successfully`);
      } catch (error) {
        console.error(`Error creating layer`, error);
      }
    },

    // Update an existing layer
    async updateLayer(updatedLayer) {
      try {
        const response = await useFetch(
          `http://localhost:8081/layers/${updatedLayer._id}`,
          {
            method: "PUT",
            body: JSON.stringify(updatedLayer),
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const result = await response.json();

        if (result > 0) {
          this.createOrReplaceLayer(updatedLayer);
          console.info(`Layer updated successfully`);
        } else {
          console.error(`Layer not found for update`);
        }
      } catch (error) {
        console.error(`Error updating layer`, error);
      }
    },

    // Delete a layer
    async deleteLayer(layerId) {
      try {
        const response = await useFetch(
          `http://localhost:8081/layers/${layerId}`,
          {
            method: "DELETE",
          }
        );

        const result = await response.json();

        if (result > 0) {
          this.layerList.delete(layerId);
          console.info(`Layer deleted successfully`);
        } else {
          console.error(`Layer not found for delete`);
        }
      } catch (error) {
        console.error(`Error deleting layer`, error);
      }
    },

    // CRUD operations for features of a specific layer
    // Fetch features for a given layer from the server
    async fetchFeaturesByLayer(layerId) {
      try {
        const { data } = await useFetch(
          `http://localhost:8081/layers/${layerId}/features`
        );

        let features = toRaw(data.value);

        // Add the features to the "features" property of the corresponding layer
        features.forEach((feature) => {
          this.createOrReplaceFeature(layerId, feature);
        });

        console.info(`Features for layer ${layerId} successfully retrieved`);
      } catch (error) {
        console.error(`Error fetching features for layer ${layerId}`, error);
      }
    },

    createOrReplaceFeature(layerId, feature) {
      const layer = this.layerList.get(layerId);
      if (layer) {
        layer.features.push(feature);
        this.layerList.set(layerId, layer);
      } else {
        console.error(`Layer ${layerId} not found for feature creation`);
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

    // Create a new feature for a given layer
    async createFeature(layerId, newFeature) {
      try {
        const response = await useFetch(
          `http://localhost:8081/layers/${layerId}/features`,
          {
            method: "POST",
            body: JSON.stringify(newFeature),
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const createdFeature = await response.json();
        // Add the feature to the "features" property of the corresponding layer
        this.createOrReplaceFeature(layerId, createdFeature);

        console.info(`Feature created successfully`);
      } catch (error) {
        console.error(`Error creating feature`, error);
      }
    },

    // Update an existing feature for a given layer
    async updateFeature(layerId, updatedFeature) {
      try {
        const response = await useFetch(
          `http://localhost:8081/layers/${layerId}/features/${updatedFeature._id}`,
          {
            method: "PUT",
            body: JSON.stringify(updatedFeature),
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const result = await response.json();

        if (result > 0) {
          // Update the feature in the "features" property of the corresponding layer
          this.createOrReplaceFeature(layerId, updatedFeature);
          console.info(`Feature updated successfully`);
        } else {
          console.error(`Feature not found for update`);
        }
      } catch (error) {
        console.error(`Error updating feature`, error);
      }
    },

    // Delete a feature for a given layer
    async deleteFeature(layerId, featureId) {
      try {
        const response = await useFetch(
          `http://localhost:8081/layers/${layerId}/features/${featureId}`,
          {
            method: "DELETE",
          }
        );

        const result = await response.json();

        if (result > 0) {
          const layer = this.layerList.get(layerId);
          if (layer) {
            // Remove the feature from the "features" property of the layer
            layer.features = layer.features.filter(
              (feature) => feature._id !== featureId
            );
            this.layerList.set(layerId, layer);
          }
          console.info(`Feature deleted successfully`);
        } else {
          console.error(`Feature not found for delete`);
        }
      } catch (error) {
        console.error(`Error deleting feature`, error);
      }
    },
  },
});
