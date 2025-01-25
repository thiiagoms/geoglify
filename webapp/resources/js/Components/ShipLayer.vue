<template>
    <div style="position: absolute; top: 90px; left: 10px; z-index: 5000">
        <v-chip label color="primary">{{ ships.length }} ships</v-chip>
    </div>
</template>

<script>
import MapHelper from "@/Helpers/MapHelper";
import ShipHelper from "@/Helpers/ShipHelper";
import store from "@/store";

export default {
    props: ["mapInstance"],

    async mounted() {
        // Initialize the ship layer and fetch initial ship data
        await this.initializeLayer();
        await this.fetchShips();

        // Listen for real-time ship position updates
        window.Echo.channel("realtime_ships").listen(
            "ShipPositionUpdated",
            (data) => {
                data.forEach((ship) => {
                    store.dispatch("addOrUpdateShip", ship);
                });
            }
        );

        // Start the update loop with a timestamp for the last update
        this.lastUpdate = Date.now(); // Store the time of the last update
        this.updateLoop();
    },

    computed: {
        // Access ships data from the store
        ships() {
            return store.getters.getShips;
        },
    },

    methods: {
        async initializeLayer() {
            // Add ship and circle icons to the map
            await MapHelper.addIcon(
                this.mapInstance,
                "shipIcon",
                "/images/boat-sdf.png"
            );
            await MapHelper.addIcon(
                this.mapInstance,
                "circleIcon",
                "/images/circle-sdf.png"
            );

            // Remove existing layers and sources to avoid duplication
            ShipHelper.removeLayers(this.mapInstance, "shipLayer");
            ShipHelper.removeSource(this.mapInstance, "shipSource");

            // Add the ship source and layer to the map
            MapHelper.addSource(this.mapInstance, "shipSource");
            ShipHelper.addLayer(this.mapInstance, "shipLayer", "shipSource");

            // Add a click listener for ships
            this.mapInstance.on("click", "shipLayer", (e) => {
                const ship = e.features[0].properties;
                this.$emit("ship-clicked", ship.mmsi);
            });
        },

        async fetchShips() {
            try {
                // Fetch ship data from the API
                const response = await fetch("/api/ships/realtime/all");
                const data = await response.json();

                // Add or update ships in the store
                data.forEach((ship) => {
                    store.dispatch("addOrUpdateShip", ship);
                });
            } catch (error) {
                console.error("API Error:", error);
            }
        },

        updateSource() {
            // Flatten the features array from the store
            const features = this.ships
                .map((ship) => ship.features) // Extract features arrays
                .flat(); // Flatten into a single array

            // Update the ship source on the map
            ShipHelper.updateSource(this.mapInstance, "shipSource", features);
        },

        updateLoop() {
            const now = Date.now(); // Get the current time
            const delta = now - this.lastUpdate; // Calculate time since the last update

            // Check if 1 second (1000ms) has passed
            if (delta >= 1000) {
                this.updateSource(); // Update the data source
                this.lastUpdate = now; // Reset the last update time
            }
            
            // Remove ships that have not been updated in the last hour
            store.dispatch("removeInactiveShips", 60 * 60 * 1000);

            // Schedule the next frame using requestAnimationFrame
            requestAnimationFrame(() => this.updateLoop());
        }
    },
};
</script>
