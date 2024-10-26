<script>
import MapHelper from "@/Helpers/MapHelper";
import ShipHelper from "@/Helpers/ShipHelper";
import "maplibre-gl/dist/maplibre-gl.css";
import ShipTable from "@/Components/ShipTable.vue";
import ShipDetails from "@/Components/ShipDetails.vue";

export default {
    components: {
        ShipTable,
        ShipDetails,
    },

    data: () => ({
        map: null,
        ships: [],
        showList: false,
        showShipDetails: false,
        selectedShip: null,
    }),

    mounted() {
        this.map = MapHelper.createMap("map"); // Create the map
        MapHelper.addNavigationControl(this.map); // Add navigation control

        this.map.on("load", async () => {
            // Add ship icon (load custom icon before adding layer)
            await MapHelper.addIcon(this.map, "ship", "/images/boat.png");
            await MapHelper.addIcon(this.map, "circle", "/images/circle.png");

            // Create the source for ships
            MapHelper.addSource(this.map, "ships");

            // Add the ships layer using the same source ID
            ShipHelper.addLayer(this.map, "ships", "ships");

            // First get ships from the server
            fetch("ships-realtime/all")
                .then((response) => {
                    // Parse the response
                    return response.json();
                })
                .then((data) => {
                    // Store ships data
                    this.ships = data;
                })
                .catch(() => {
                    // Failed to fetch data from the server
                    this.ships = [];
                })
                .finally(() => {
                    // Create ship features using this.ships
                    const features = ShipHelper.createShipFeatures(this.ships);
                    MapHelper.updateSource(this.map, "ships", features);

                    // Init listener for ship click
                    this.map.on("click", "ships", (e) => {
                        const ship = e.features[0].properties;
                        this.showShipDetails = true;
                        this.selectedShip = ship;
                        this.highlightShip(ship.mmsi);
                    });

                    // Init listener for realtime ship updates
                    /*window.Echo.channel("realtime_ships").listen(
                        "BroadcastShipPositionUpdate",
                        (ship) => {
                            const source = this.map.getSource("ships");
                            if (!source) return;

                            const features = source._data.features;
                            ShipHelper.updateShipPosition(features, ship);

                            this.ships.push(ship);
                            MapHelper.updateSource(this.map, "ships", features);
                        }
                    );**/
                });
        });
    },

    methods: {
        // Update ships on the map
        updateShipsOnMap(filteredShips) {
            const features = ShipHelper.createShipFeatures(filteredShips);
            MapHelper.updateSource(this.map, "ships", features);
        },

        // Highlight ship on the map
        highlightShip(mmsi) {
            // Get all features
            const features = this.map.getSource("ships")._data.features;
            const selectedFeature = features.find(
                (f) => f.properties.mmsi === mmsi
            );

            if (selectedFeature) {
                // Set priority to 200
                selectedFeature.properties.priority = 200;

                // Update the source
                MapHelper.updateSource(this.map, "ships", features);

                // Fly to the selected ship
                this.map.flyTo({
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
        @click="showList = !showList"
        rounded="sm"
        elevation="2"
    ></v-fab>

    <div id="map"></div>

    <v-navigation-drawer
        v-model="showList"
        location="bottom"
        style="z-index: 1001"
        permanent
    >
        <ShipTable
            v-if="showList"
            :ships="ships"
            @filteredShips="updateShipsOnMap"
        />
    </v-navigation-drawer>

    <v-navigation-drawer
        width="400"
        v-model="showShipDetails"
        location="right"
        style="z-index: 1002"
        permanent
    >
        <ShipDetails v-if="selectedShip" :ship="selectedShip"> </ShipDetails>
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
