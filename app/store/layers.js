export const state = () => ({
  list: [],
  selected: [],
  listOpened: false,
});

export const actions = {
  // Action to search for layers
  async SEARCH(_, payload) {
    return new Promise(async (resolve) => {
      // Fetch the search results from the server
      const results = await $fetch("/api/layers/search", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // Resolve the promise with the search results
      resolve(results);
    });
  },

  // Action to fetch the layer list
  async GET_FEATURES({ commit }, layerId) {
    return new Promise(async (resolve) => {
      // Set the layer as loading
      commit("setStateLoadingLayer", { layerId, isLoading: true });

      // Fetch the features from the server
      const features  = await $fetch(`api/layers/${layerId}/features`);

      // Set the layer features
      commit("setLayerFeatures", { layerId, features });

      // Set the layer as not loading
      commit("setStateLoadingLayer", { layerId, isLoading: false });

      // Resolve the promise with the features
      resolve(features);
    });
  },

  // Action to clear the features of a layer
  async CLEAR_FEATURES({ commit }, layerId) {
    return new Promise(async (resolve) => {
      // Set the layer as loading
      commit("setStateLoadingLayer", { layerId, isLoading: true });

      // Set the layer features as an empty array
      commit("setLayerFeatures", { layerId, features: [] });

      // Set the layer as not loading
      commit("setStateLoadingLayer", { layerId, isLoading: false });

      // Resolve the promise
      resolve();
    });
  },
};

export const mutations = {
  // Action to create or replace the layer list
  setStateLoadingLayer(state, { layerId, isLoading }) {
    state.list = state.list.map((layer) => {
      if (layer._id === layerId) {
        return {
          ...layer,
          isLoading,
        };
      }

      return layer;
    });
  },

  // Action to set the selected layer
  setLayerFeatures(state, { layerId, features }) {
    state.list = state.list.map((layer) => {
      if (layer._id === layerId) {
        return {
          ...layer,
          features,
        };
      }

      return layer;
    });
  },
};
