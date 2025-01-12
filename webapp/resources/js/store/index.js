import { createStore } from "vuex";

// Create and export the store
export default createStore({
    state: {
        selectedShip: null, // Initial state
    },
    mutations: {
        setSelectedShip(state, ship) {
            state.selectedShip = ship; // Mutation to update the state
        },
    },
    actions: {
        updateSelectedShip({ commit }, ship) {
            commit("setSelectedShip", ship); // Action to commit the mutation
        },
    },
    getters: {
        getSelectedShip(state) {
            return state.selectedShip; // Getter to access the state
        },
    },
});
