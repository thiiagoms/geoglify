export const state = () => ({
  selected: null,
});

export const actions = {
  // Action to set the selected feature
  SELECTED_FEATURE({ commit }, feature) {
    commit("setSelected", feature);
  },
};

export const mutations = {
  // Action to set the selected feature
  setSelected(state, feature) {
    state.selected = feature;
  },
};
