<template>
    <div style="position: absolute; top: 90px; left: 10px; z-index: 5000">
        <v-chip label color="primary">{{ this.ships.length }} ships </v-chip>
    </div>
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
            updateQueue: [], // Queue to store updates to be processed sequentially.
        };
    },

    watch: {
        mapInstance(newVal) {
            // Watches for changes in 'mapInstance'. When it's available, it calls 'initializeLayer'.
            if (newVal) {
                this.initializeLayer();
            }
        },

        selectedShip(newShip) {
            if (newShip) {
                this.centerOnMap(newShip);
            }
        },
    },

    computed: {
        selectedShip() {
            return this.$store.state.selectedShip;
        },
    },

    mounted() {
        // When the component is mounted, checks if 'mapInstance' is available.
        if (this.mapInstance) {
            this.initializeLayer();
        }
    },

    methods: {
        // Function responsible for initializing the layer on the map.
        async initializeLayer() {
            // Add the ship icon to the map
            await MapHelper.addIcon(
                this.mapInstance,
                "shipIcon",
                "/images/boat-sdf.png"
            );

            // Add the circle icon to the map
            await MapHelper.addIcon(
                this.mapInstance,
                "circleIcon",
                "/images/circle-sdf.png"
            );

            // Remove existing layers and sources to ensure no overlapping
            ShipHelper.removeLayers(this.mapInstance, "shipLayer");
            ShipHelper.removeSource(this.mapInstance, "shipSource");

            // Create the source for ships
            MapHelper.addSource(this.mapInstance, "shipSource");

            // Add the ships layer using the same source ID
            ShipHelper.addLayer(this.mapInstance, "shipLayer", "shipSource");

            // Handle ship clicks
            this.mapInstance.on("click", "shipLayer", (e) => {
                const ship = e.features[0].properties;
                this.$emit("ship-clicked", ship.mmsi);
            });

            this.mapInstance.on("click", "shipLayer-polygon-skeleton", (e) => {
                const ship = e.features[0].properties;
                this.$emit("ship-clicked", ship.mmsi);
            });

            // Fetch ship data in real-time from the server
            fetch("/api/ships/realtime/all")
                .then((response) => response.json())
                .then((data) => {
                    // Directly pass the API data to updateShipSource
                    this.updateShipSource(data);
                })
                .catch((error) => {
                    console.error("API Error:", error);
                    this.ships = []; // Reset the ship list on error
                })
                .finally(() => {
                    // Listen for real-time updates
                    window.Echo.channel("realtime_ships").listen(
                        "ShipPositionUpdated",
                        (data) => {
                            this.updateShipSource(data);
                        }
                    );
                });
        },

        updateShipSource(data) {
            // Adiciona os novos dados à fila
            this.updateQueue.push(data);

            // Se já estiver processando, retorna
            if (this.isUpdating) return;

            // Processa a fila
            this.processUpdateQueue();
        },

        processUpdateQueue() {
            if (this.updateQueue.length === 0) {
                this.isUpdating = false;
                return;
            }

            this.isUpdating = true;

            // Pega os próximos dados da fila
            const data = this.updateQueue.shift();

            requestAnimationFrame(() => {
                const existingShipsMap = new Map(
                    this.ships.map((ship) => [ship.mmsi, ship])
                );

                let updatedFeatures = [];

                data.forEach((ship) => {
                    const existingShip = existingShipsMap.get(ship.mmsi);

                    if (existingShip) {
                        Object.assign(existingShip, ship);
                        updatedFeatures.push(
                            ShipHelper.createShipFeature(existingShip)
                        );
                    } else {
                        this.ships.push(ship);
                        updatedFeatures.push(
                            ShipHelper.createShipFeature(ship)
                        );
                    }
                });

                // Clean null features
                updatedFeatures = updatedFeatures.filter(
                    (feature) => feature !== null
                );
                
                // flat the array
                updatedFeatures = updatedFeatures.flat();

                if (updatedFeatures.length > 0) {
                    console.log("Updated Features:", updatedFeatures);
                    MapHelper.updateSource(
                        this.mapInstance,
                        "shipSource",
                        updatedFeatures
                    );
                }

                // Processa a próxima atualização na fila
                this.processUpdateQueue();
            });
        },

        // Function to center the map on a selected ship
        centerOnMap(ship) {
            // Find the ship in the list of ships by MMSI
            const selectedShip = this.ships.find((s) => s.mmsi === ship.mmsi);

            // Parse geojson data to get the coordinates
            const point = JSON.parse(selectedShip.geojson);

            // Get the coordinates of the ship
            const coordinates = point.coordinates;

            // If the ship is found, fly to its position on the map
            if (coordinates) {
                this.mapInstance.flyTo({
                    center: coordinates,
                    zoom: 17,
                    bearing: -37.5,
                    speed: 1.5,
                    curve: 1,
                });
            }
        },
    },
};
</script>
