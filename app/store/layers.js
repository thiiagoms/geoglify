export const state = () => ({
  list: [],
  selected: [],
  listOpened: false,
});

export const actions = {
  // Action to create or replace the layer list
  async CREATE_OR_REPLACE({ commit }, layers) {
    commit("createOrReplace", layers);
  },

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
};
