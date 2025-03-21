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
                        placeholder="SEARCH"
                        autofocus
                        hide-details="auto"
                        clearable
                        variant="solo"
                    ></v-text-field>
                </v-card-title>
                <v-card-text class="pa-0 ma-0 bg-primary" style="results">
                    <!-- List of search results -->
                    <div v-if="ships.length > 0">
                        <!-- Total results found -->
                        <div
                            class="text-body-2 font-weight-bold text-right pa-3"
                            style="
                                border-bottom: 1px solid rgba(0, 0, 0, 0.12) !important;
                            "
                        >
                            Total results: {{ totalItems }}
                        </div>

                        <v-list class="bg-primary pa-0 ma-0">
                            <v-list-item
                                v-for="ship in ships"
                                :key="ship.mmsi"
                                @click="selectShip(ship)"
                            >
                                <!-- Ship photo -->
                                <template v-slot:prepend>
                                    <v-avatar
                                        rounded="md"
                                        class="bg-white"
                                        style="
                                            border-radius: 2px;
                                            height: 80px;
                                            width: 100px;
                                        "
                                    >
                                        <v-img
                                            :src="`https://photos.marinetraffic.com/ais/showphoto.aspx?imo=${ship.imo}`"
                                            alt="Ship photo"
                                        >
                                            <template v-slot:error>
                                                <v-img
                                                    src="/images/placeholder.png"
                                                    alt="Ship photo"
                                                ></v-img>
                                            </template>
                                        </v-img>
                                    </v-avatar>
                                </template>

                                <!-- Ship name and MMSI -->
                                <v-list-item-title
                                    class="font-weight-black text-h6"
                                >
                                    <country-flag
                                        :country="ship.country_iso_code ?? 'XX'"
                                        rounded
                                    />
                                    <span class="pl-3">{{
                                        ship.name ?? "N/A"
                                    }}</span>
                                </v-list-item-title>
                                <v-list-item-subtitle
                                    class="text-body-1"
                                    v-html="`MMSI: ${ship.mmsi}`"
                                ></v-list-item-subtitle>

                                <!-- Icon to center the ship on the map -->
                                <template v-slot:append>
                                    <v-icon @click.stop="centerOnMap(ship)"
                                        >mdi-arrow-right</v-icon
                                    >
                                </template>
                            </v-list-item>
                        </v-list>

                        <!-- Pagination -->
                        <v-pagination
                            v-model="currentPage"
                            :length="totalPages"
                            :total-visible="5"
                            @update:modelValue="fetchShips"
                            density="comfortable"
                        ></v-pagination>
                    </div>

                    <!-- Loading spinner -->
                    <div v-else-if="isLoading" class="text-center py-10 ma-5">
                        <v-skeleton-loader
                            class="mx-auto border bg-primary"
                            type="list-item-avatar-three-line"
                            v-for="n in 5"
                            :key="n"
                        ></v-skeleton-loader>
                    </div>

                    <!-- No results message -->
                    <div v-else class="text-center py-4">
                        <v-alert class="text-center bg-primary" elevation="0">
                            No results found for "<em>{{ search }}</em
                            >"
                        </v-alert>
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
            ships: [], // List of ships from the search
            isLoading: false, // Loading state
            search: "", // Search query
            currentPage: 1, // Current page
            itemsPerPage: 5, // Items per page
            totalItems: 0, // Total number of items
        };
    },
    computed: {
        // Calculate total pages based on total items and items per page
        totalPages() {
            return Math.ceil(this.totalItems / this.itemsPerPage);
        },
    },
    created() {
        // Create a debounced version of the fetchShips function with a 500ms delay
        this.debouncedFetchShips = debounce(this.fetchShips, 500);

        // Add global event listener for Ctrl+K
        window.addEventListener("keydown", this.handleGlobalKeydown);
        
        // Fetch ships when the component is created
        this.fetchShips();
    },
    beforeUnmount() {
        // Remove the global event listener when the component is destroyed
        window.removeEventListener("keydown", this.handleGlobalKeydown);
    },
    watch: {
        search() {
            // Reset the current page to 1 when the search query changes
            this.currentPage = 1;
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

            this.isLoading = true; // Set loading state to true
            this.ships = []; // Clear the ships list
            this.totalItems = 0; // Reset total items

            try {
                const response = await fetch(
                    `/api/ships/realtime/search?text=${this.search}&page=${this.currentPage}&per_page=${this.itemsPerPage}`
                );
                const data = await response.json();
                this.ships = data.data; // Update the ships list with the search results
                this.totalItems = data.total; // Update the total number of items
            } catch (error) {
                console.error("Error fetching ships:", error);
                this.ships = []; // Reset the ships list on error
                this.totalItems = 0; // Reset total items
            } finally {
                this.isLoading = false; // Set loading state to false
            }
        },
        selectShip(ship) {
            // Update the selectedShip in the store
            this.$store.dispatch("setSelectedShip", ship);
            this.closeDialog(); // Close the dialog after selecting a ship
        },
        centerOnMap(ship) {
            // Logic to center the map on the selected ship
            this.$store.dispatch("setSelectedShip", ship);
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
.results {
    max-height: 500px;
    overflow-y: auto;
}

.v-list-item {
    border-bottom: 1px solid rgba(0, 0, 0, 0.12) !important;
}

em {
    font-weight: bold;
    font-style: normal;
}
</style>
