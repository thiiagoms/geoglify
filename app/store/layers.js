export const state = () => ({
  list: [],
  total: 0,
  selected: [],
  listOpened: false,
});

export const actions = {
  // Action to search for layers
  async SEARCH({ commit }, payload) {
    return new Promise(async (resolve) => {
      const config = useRuntimeConfig();

      // Fetch the search results from the server
      const results = await $fetch(config.public.API_URL + "/layers/search", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      commit("setList", results.items);

      commit("setTotal", results.total);

      // Resolve the promise with the search results
      resolve(results);
    });
  },

  // Action to fetch the layer list
  async GET_FEATURES({ commit }, layerId) {
    return new Promise(async (resolve) => {
      const config = useRuntimeConfig();

      // Set the layer loading state to true
      commit("setLayerLoading", { layerId, loading: true });

      // Set the layer features as an empty array
      commit("setLayerFeatures", { layerId, features: [] });

      // Fetch the features from the server
      const features = await $fetch(config.public.API_URL + `/layers/${layerId}/features`);

      // Set the layer features
      commit("setLayerFeatures", { layerId, features });

      // Add layerId to selected layers
      commit("setSelected", layerId);

      // Resolve the promise with the features
      resolve(features);
    });
  },

  // Action to clear the features of a layer
  async CLEAR_FEATURES({ commit }, layerId) {
    return new Promise(async (resolve) => {
      // Set the layer loading state to true
      commit("setLayerLoading", { layerId, loading: true });

      // Set the layer features as an empty array
      commit("setLayerFeatures", { layerId, features: [] });

      // Remove layerId from selected layers
      commit("unsetSelected", layerId);

      // Set the layer loading state to false
      commit("setLayerLoading", { layerId, loading: false });

      // Resolve the promise
      resolve();
    });
  },

  async CREATE({ commit }, { data }) {
    return new Promise(async (resolve) => {
      const config = useRuntimeConfig();

      // Fetch the search results from the server
      const results = await $fetch(config.public.API_URL + "/layers", {
        method: "POST",
        body: JSON.stringify(data),
      });

      // Resolve the promise with the search results
      resolve(results);
    });
  },

  async UPDATE({ commit }, { layerId, data }) {
    return new Promise(async (resolve) => {
      const config = useRuntimeConfig();

      // Fetch the search results from the server
      const results = await $fetch(config.public.API_URL + `/layers/${layerId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });

      // Resolve the promise with the search results
      resolve(results);
    });
  },

  async DELETE({ commit }, { layerId }) {
    return new Promise(async (resolve) => {
            
      const config = useRuntimeConfig();

      // Fetch the search results from the server
      const results = await $fetch(config.public.API_URL + `/layers/${layerId}`, {
        method: "DELETE",
      });

      // Resolve the promise with the search results
      resolve(results);
    });
  },

  async UPLOAD_DATA({ commit }, { layerId, file }) {
    return new Promise(async (resolve) => {

      const config = useRuntimeConfig();

      const formData = new FormData();
      formData.append("file", file);

      // Fetch the search results from the server
      const results = await $fetch(config.public.API_URL + `/layers/${layerId}/features/upload`, {
        method: "POST",
        body: formData,
      });

      // Resolve the promise with the results
      resolve(results);
    });
  },

  async UPDATE_STYLE({ commit }, { layerId, style }) {
    return new Promise(async (resolve) => {

      const config = useRuntimeConfig();

      // Fetch the search results from the server
      const results = await $fetch(config.public.API_URL + `/layers/${layerId}/style`, {
        method: "POST",
        body: JSON.stringify(style),
      });

      // Resolve the promise with the search results
      resolve(results);
    });
  },

  SET_LAYER_LOADING({ commit }, { layerId, loading }) {
    commit("setLayerLoading", { layerId, loading });
  },
};

export const mutations = {
  // Action to create or replace the layer list
  setList(state, list) {
    if (!!list) {
      list.map((layer) => {
        if (state.selected.includes(layer.id)) {
          layer.selected = true;
        } else {
          layer.selected = false;
        }

        layer.loading = false;
      });
    }

    state.list = list;
  },

  // Action to set the total number of layers
  setTotal(state, total) {
    state.total = total;
  },

  // Action to set the layer loading state
  setLayerLoading(state, { layerId, loading }) {
    state.list = state.list.map((layer) => {
      if (layer.id === layerId) {
        return {
          ...layer,
          loading: loading,
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
