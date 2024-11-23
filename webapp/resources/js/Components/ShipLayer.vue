<script>
import MapHelper from "@/Helpers/MapHelper";
import ShipHelper from "@/Helpers/ShipHelper";

export default {
    props: ["mapInstance"],

    watch: {
        mapInstance(newVal) {
            if (newVal) {
                this.initializeLayer();
            }
        },
    },

    mounted() {
        if (this.mapInstance) {
            this.initializeLayer();
        }
    },

    methods: {
        async initializeLayer() {
            // Add the ship icon
            await MapHelper.addIcon(
                this.mapInstance,
                "shipIcon",
                "/images/boat.png"
            );

            // Add the circle icon
            await MapHelper.addIcon(
                this.mapInstance,
                "circleIcon",
                "/images/circle.png"
            );

            // Remove source and layer if already exists
            if (this.mapInstance.getSource("shipSource")) {
                this.mapInstance.removeLayer("shipLayer");
                this.mapInstance.removeSource("shipSource");
            }

            // Create the source for ships
            MapHelper.addSource(this.mapInstance, "shipSource");

            // Add the ships layer using the same source ID
            ShipHelper.addLayer(this.mapInstance, "shipLayer", "shipSource");

            // Fetch ships data from the server
            fetch("/api/ships/realtime/all")
                .then((response) => response.json())
                .then((data) => {
                    this.shipData = data;
                })
                .catch(() => {
                    this.shipData = [];
                })
                .finally(() => {
                    this.updateShipSource(this.shipData);

                    // Initialize click listener for ship selection
                    this.mapInstance.on("click", "shipLayer", (e) => {
                        const ship = e.features[0].properties;
                        this.$emit("ship-clicked", ship.mmsi);
                    });

                    // Listener for real-time ship updates
                    window.Echo.channel("realtime_ships").listen(
                        "ShipPositionUpdated",
                        (data) => {
                            this.updateShipSource(data);
                        }
                    );
                });
        },

        updateShipSource(shipData) {
            const features = ShipHelper.createShipFeatures(shipData);
            MapHelper.updateSource(this.mapInstance, "shipSource", features);
        },

        updateShipsOnMap(filteredShips) {
            this.updateShipSource(filteredShips);
        },
    },
};
</script>

<template>
    <div></div>
</template>

<style scoped></style>
