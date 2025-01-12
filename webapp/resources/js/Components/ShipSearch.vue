<template>
    <div>
        <!-- Button that opens the dialog -->
        <v-btn
            prepend-icon="mdi-magnify"
            variant="tonal"
            @click="openDialog"
            width="200"
            >Search (Ctrl + K)</v-btn
        >

        <!-- Search dialog -->
        <v-dialog
            v-model="dialog"
            max-width="600"
            @keydown.esc="closeDialog"
            class="pa-0 ma-0"
        >
            <v-card class="pa-0 ma-0">
                <v-card-title class="pa-0 ma-0">
                    <!-- Search input inside the dialog -->
                    <v-text-field
                        v-model="search"
                        placeholder="Search for ships"
                        autofocus
                        @input="debouncedFetchShips"
                        hide-details="auto"
                    ></v-text-field>
                </v-card-title>
                <v-card-text class="pa-0 ma-0">
                    <!-- List of search results -->
                    <v-list v-if="ships.length > 0">
                        <v-list-item
                            v-for="ship in ships"
                            :key="ship.mmsi"
                            @click="centerOnMap(ship)"
                        >
                            <!-- Ship photo -->
                            <template v-slot:prepend>
                                <v-avatar rounded="0" class="bg-grey">
                                    <v-img
                                        :src="`/api/ships/${ship.id}/photo`"
                                        alt="Ship photo"
                                    ></v-img>
                                </v-avatar>
                            </template>

                            <!-- Ship name and MMSI -->
                            <v-list-item-title
                                v-html="ship.name"
                            ></v-list-item-title>
                            <v-list-item-subtitle
                                v-html="`MMSI: ${ship.mmsi}`"
                            ></v-list-item-subtitle>

                            <!-- Icon to center the ship on the map -->
                            <template v-slot:append>
                                <v-icon @click.stop="centerOnMap(ship)"
                                    >mdi-map-marker</v-icon
                                >
                            </template>
                        </v-list-item>
                    </v-list>

                    <!-- Placeholder when no search results are available -->
                    <div v-else-if="!isLoading" class="text-center py-4">
                        <v-icon size="64" color="grey">mdi-ship-wheel</v-icon>
                        <p class="text-grey text-h6 mt-2">
                            Your search results will appear here
                        </p>
                    </div>

                    <div v-else class="text-center py-4">
                        <v-skeleton-loader loading type="list-item-two-line">
                            <v-list-item
                                lines="two"
                                subtitle="Subtitle"
                                title="Title"
                                rounded
                                v-for="n in 5"
                                :key="n"
                            ></v-list-item>
                        </v-skeleton-loader>
                    </div>
                </v-card-text>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import { debounce } from "lodash"; // Import debounce function from lodash

export default {
    data() {
        return {
            dialog: false, // Controls the visibility of the dialog
            selectedShip: null,
            ships: [], // List of ships from the search
            isLoading: false, // Loading state
            search: "", // Search query
        };
    },
    created() {
        // Create a debounced version of the fetchShips function
        this.debouncedFetchShips = debounce(this.fetchShips, 300);

        // Add global event listener for Ctrl+K
        window.addEventListener("keydown", this.handleGlobalKeydown);
    },
    beforeUnmount() {
        // Remove the global event listener when the component is destroyed
        window.removeEventListener("keydown", this.handleGlobalKeydown);
    },
    watch: {
        search() {
            // Call the debounced version of fetchShips when the search query changes
            this.debouncedFetchShips();
        },
    },
    methods: {
        openDialog() {
            this.dialog = true; // Open the dialog
        },
        closeDialog() {
            this.dialog = false; // Close the dialog
        },
        async fetchShips() {
            // Fetch ships only if the search query is longer than 0 characters
            if (this.search && this.search.length > 0) {
                this.isLoading = true;
                try {
                    const response = await fetch(
                        `/api/ships/realtime/search?text=${this.search}`
                    );
                    const data = await response.json();
                    this.ships = data; // Update the ships list with the search results
                } catch (error) {
                    console.error("Error fetching ships:", error);
                } finally {
                    this.isLoading = false;
                }
            } else {
                this.ships = []; // Clear the ships list if the search query is too short
            }
        },
        centerOnMap(ship) {
            // Logic to center the map on the selected ship
            this.$store.dispatch("updateSelectedShip", ship);
            this.closeDialog(); // Close the dialog after selecting a ship
        },
        handleGlobalKeydown(event) {
            // Check if Ctrl+K is pressed
            if (event.ctrlKey && event.key === "k") {
                event.preventDefault(); // Prevent the default browser behavior
                this.openDialog(); // Open the dialog
            }
        },
    },
};
</script>

<style>
em {
    font-weight: bold;
    font-style: normal;
}
</style>
