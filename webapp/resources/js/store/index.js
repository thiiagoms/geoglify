import { createStore } from "vuex"; // Import Vuex's createStore function
import ShipHelper from "@/Helpers/ShipHelper"; // Import ShipHelper for ship feature creation

// Create and export the Vuex store
export default createStore({
    state: {
        ships: [], // Array to store ship data
    },
    mutations: {
        // Mutation to add or update a ship in the state
        addOrUpdateShip(state, ship) {
            // Find the index of the ship in the array based on its MMSI (unique identifier)
            const index = state.ships.findIndex((s) => s.mmsi === ship.mmsi);

            // Generate ship features using ShipHelper
            ship.features = ShipHelper.createShipFeature(ship) || [];

            // If the ship already exists, update it; otherwise, add it to the array
            if (index !== -1) {
                state.ships.splice(index, 1, ship); // Replace the existing ship
            } else {
                state.ships.push(ship); // Add the new ship
            }
        },

        removeInactiveShips(state, maxInactiveTime) {
            const currentTime = new Date().getTime(); // Get the current timestamp in milliseconds

            state.ships = state.ships.filter((ship) => {
                // Convert the `last_updated` string to a timestamp
                const lastUpdated = new Date(ship.last_updated).getTime();

                // Check if the ship is still active
                return currentTime - lastUpdated <= maxInactiveTime;
            });
        },
    },
    actions: {
        // Action to commit the addOrUpdateShip mutation
        addOrUpdateShip({ commit }, ship) {
            commit("addOrUpdateShip", ship);
        },

        // Action to commit the removeInactiveShips mutation
        removeInactiveShips({ commit }, maxInactiveTime) {
            commit("removeInactiveShips", maxInactiveTime);
        },
    },
    getters: {
        // Getter to retrieve the list of ships from the state
        getShips(state) {
            return state.ships;
        },
    },
});
