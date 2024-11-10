<script>
import MapHelper from "@/Helpers/MapHelper";
import ShipHelper from "@/Helpers/ShipHelper";
import PortHelper from "@/Helpers/PortHelper";
import SearoutesHelper from "@/Helpers/SearoutesHelper";

import "maplibre-gl/dist/maplibre-gl.css";
import ShipTable from "@/Components/ShipTable.vue";
import ShipDetails from "@/Components/ShipDetails.vue";

export default {
    components: {
        ShipTable,
        ShipDetails,
    },

    data: () => ({
        mapInstance: null,
        shipData: [],
        isShipListVisible: false,
        activeShip: null,
    }),

    mounted() {
        this.mapInstance = MapHelper.createMap("map"); // Create the map
        MapHelper.addNavigationControl(this.mapInstance); // Add navigation control

        this.mapInstance.on("load", async () => {
            // Create the source for searoutes
            MapHelper.addSource(this.mapInstance, "searouteSource");

            // Create the source for ports
            MapHelper.addSource(this.mapInstance, "portSource");

            // Add the ports layer using the same source ID
            PortHelper.addLayer(this.mapInstance, "portLayer", "portSource");

            // Fetch ports data from the server
            fetch(route("ports.geojson"))
                .then((response) => response.json())
                .then((geojson) => {
                    MapHelper.updateSource(
                        this.mapInstance,
                        "portSource",
                        geojson.features
                    );
                });

            // Add ship icons
            await MapHelper.addIcon(
                this.mapInstance,
                "shipIcon",
                "/images/boat.png"
            );
            await MapHelper.addIcon(
                this.mapInstance,
                "circleIcon",
                "/images/circle.png"
            );

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
                    const features = ShipHelper.createShipFeatures(
                        this.shipData
                    );

                    MapHelper.updateSource(
                        this.mapInstance,
                        "shipSource",
                        features
                    );

                    // Initialize click listener for ship selection
                    this.mapInstance.on("click", "shipLayer", (e) => {
                        const ship = e.features[0].properties;
                        this.activeShip = ship;
                        this.highlightShip(ship.mmsi);
                    });

                    // Listener for real-time ship updates
                    window.Echo.channel("realtime_ships").listen(
                        "ShipPositionUpdated",
                        (data) => {
                            // Create features for the new ship data
                            const newFeatures =
                                ShipHelper.createShipFeatures(data);

                            // Get the current ship source
                            const source =
                                this.mapInstance.getSource("shipSource");
                            if (source) {
                                const currentFeatures =
                                    source._data.features || [];

                                // Update the features with the new data
                                const updatedFeatures =
                                    ShipHelper.updateShipFeatures(
                                        currentFeatures,
                                        newFeatures
                                    );

                                // Update the source with the new data
                                source.setData({
                                    type: "FeatureCollection",
                                    features: updatedFeatures,
                                });
                            }
                        }
                    );
                });
        });
    },

    methods: {
        // Update ships on the map
        updateShipsOnMap(filteredShips) {
            const features = ShipHelper.createShipFeatures(filteredShips);
            MapHelper.updateSource(this.mapInstance, "shipSource", features);
        },

        // Highlight ship on the map
        highlightShip(mmsi) {
            const features =
                this.mapInstance.getSource("shipSource")._data.features;
            const selectedFeature = features.find(
                (feature) => feature.properties.mmsi === mmsi
            );

            if (selectedFeature) {
                selectedFeature.properties.priority = 200;

                MapHelper.updateSource(
                    this.mapInstance,
                    "shipSource",
                    features
                );

                this.mapInstance.flyTo({
                    center: selectedFeature.geometry.coordinates,
                    zoom: 15,
                });
            }
        },
    },
};
</script>

<template>
    <v-fab
        color="primary"
        icon="mdi-ferry"
        location="top start"
        density="comfortable"
        absolute
        app
        appear
        @click="isShipListVisible = !isShipListVisible"
        rounded="sm"
        elevation="2"
    ></v-fab>

    <div id="map"></div>

    <v-navigation-drawer
        v-model="isShipListVisible"
        location="bottom"
        style="z-index: 1001"
        permanent
    >
        <ShipTable
            v-if="isShipListVisible"
            :ships="shipData"
            @filteredShips="updateShipsOnMap"
        />
    </v-navigation-drawer>

    <v-navigation-drawer
        width="400"
        v-model="activeShip"
        location="right"
        style="z-index: 1002"
        permanent
        v-if="!!activeShip"
    >
        <ShipDetails :key="activeShip.mmsi" :ship="activeShip" />
    </v-navigation-drawer>
</template>

<style>
#map {
    height: 100%;
    width: 100%;
}

html,
body {
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
}
</style>
