<template>
    <div></div>
</template>
<script>
import MapHelper from "@/Helpers/MapHelper"; // Imports the MapHelper, which contains helper functions for manipulating the map.
import ShipHelper from "@/Helpers/ShipHelper"; // Imports the ShipHelper, which contains helper functions for handling ship layers.

export default {
    props: ["mapInstance"], // The 'mapInstance' prop is passed to the component, representing the map instance.

    data() {
        return {
            ships: [], // List of ships that will be updated with data from the server.
            isUpdating: false, // Flag to check if an update is already in progress. Prevents simultaneous updates.
        };
    },

    watch: {
        mapInstance(newVal) {
            // Watches for changes in 'mapInstance'. When it's available, it calls 'initializeLayer'.
            if (newVal) {
                this.initializeLayer();
            }
        },
    },

    mounted() {
        // When the component is mounted, checks if 'mapInstance' is available.
        if (this.mapInstance) {
            this.initializeLayer();
        }
    },

    methods: {
        async initializeLayer() {
            // Function responsible for initializing the layer on the map.

            // Adds the ship icon to the map
            await MapHelper.addIcon(
                this.mapInstance,
                "shipIcon",
                "/images/boat-sdf.png"
            );

            // Adds the circle icon to the map
            await MapHelper.addIcon(
                this.mapInstance,
                "circleIcon",
                "/images/circle-sdf.png"
            );

            // Removes existing layers and sources to ensure no overlapping
            ShipHelper.removeLayers(this.mapInstance, "shipLayer");
            ShipHelper.removeSource(this.mapInstance, "shipSource");

            // Creates the source for ships
            MapHelper.addSource(this.mapInstance, "shipSource");

            // Adds the ships layer using the same source ID
            ShipHelper.addLayer(this.mapInstance, "shipLayer", "shipSource");

            // Fetches ship data in real-time from the server
            fetch("/api/ships/realtime/all")
                .then((response) => response.json()) // Converts the response to JSON format
                .then((data) => {
                    this.ships = data; // Updates the ship list with the received data
                })
                .catch(() => {
                    this.ships = []; // If there's an error, resets the ship list to an empty array
                })
                .finally(() => {
                    // After the data is loaded, calls the function to update the ship source
                    this.updateShipSource(this.ships);                   

                    // Listens for real-time updates on the ship's position
                    window.Echo.channel("realtime_ships").listen(
                        "ShipPositionUpdated", // The event for updating the ship's position
                        (data) => {
                            //this.updateShipSource(data); // Updates the source with the received data
                        }
                    );
                });
        },

        // Function to update the map source with new ship data
        updateShipSource(data) {
            // If an update is already in progress, do nothing to avoid overloading with updates.
            if (this.isUpdating) return;

            // Marks that the update is in progress
            this.isUpdating = true;

            // Uses 'requestAnimationFrame' to ensure the update happens in the next available animation frame, avoiding map freezes.
            requestAnimationFrame(() => {
                // Updates the ship list with the new data
                data.forEach((ship) => {
                    // Checks if the ship already exists in the list
                    const shipIndex = this.ships.findIndex(
                        (s) => s.mmsi === ship.mmsi
                    );

                    // If the ship exists, updates the ship data
                    if (shipIndex !== -1) {
                        this.ships[shipIndex] = ship;
                    } else {
                        // If the ship doesn't exist, adds the new ship data
                        this.ships.push(ship);
                    }
                });

                // Creates the features for the ships using the updated data
                const features = ShipHelper.createShipFeatures(this.ships);

                // Updates the map source with the new or updated features
                MapHelper.updateSource(
                    this.mapInstance,
                    "shipSource",
                    features
                );

                // After the update is completed, resets the 'isUpdating' flag
                this.isUpdating = false;
            });
        },
    },
};
</script>
