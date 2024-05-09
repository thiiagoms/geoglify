export const state = () => ({
  list: [],
  selected: [],
  listOpened: false,
});

export const actions = {
  // Action to search for layers
  async SEARCH({ commit }, payload) {
    return new Promise(async (resolve) => {
      
      // Fetch the search results from the server
      const results = await $fetch("/api/layers/search", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      commit('setList', results.items);

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
      const features = await $fetch(`api/layers/${layerId}/features`);

      // Set the layer features
      commit("setLayerFeatures", { layerId, features });

      // Set the layer as not loading
      commit("setStateLoadingLayer", { layerId, isLoading: false });

      // Add layerId to selected layers
      commit("setSelected", layerId);

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

      // Remove layerId from selected layers
      commit("unsetSelected", layerId);

      // Resolve the promise
      resolve();
    });
  },

  async CREATE({ commit }, data) {
    return new Promise(async (resolve) => {
      // Fetch the search results from the server
      const results = await $fetch("/api/layers", {
        method: "POST",
        body: JSON.stringify(data),
      });

      // Resolve the promise with the search results
      resolve(results);
    });
  },

  async UPDATE({ commit }, { layerId, data }) {
    return new Promise(async (resolve) => {
      // Fetch the search results from the server
      const results = await $fetch(`/api/layers/${layerId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });

      // Resolve the promise with the search results
      resolve(results);
    });
  },

  async DELETE({ commit }, layerId) {
    return new Promise(async (resolve) => {
      // Fetch the search results from the server
      const results = await $fetch(`/api/layers/${layerId}`, {
        method: "DELETE",
      });

      // Resolve the promise with the search results
      resolve(results);
    });
  },
};

export const mutations = {

  // Action to create or replace the layer list
  setList(state, list) {
    state.list = list;
  },

  // Action to create or replace the layer list
  setStateLoadingLayer(state, { layerId, isLoading }) {
    state.list = state.list.map((layer) => {
      if (layer.id === layerId) {
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
      if (layer.id === layerId) {
        return {
          ...layer,
          features,
        };
      }

      return layer;
    });
  },

  // Action to set the selected layer
  setSelected(state, layerId) {
    if (!state.selected.includes(layerId)) state.selected.push(layerId);
  },

  // Action to unset the selected layer
  unsetSelected(state, layerId) {
    state.selected = state.selected.filter((id) => id !== layerId);
  },
};
