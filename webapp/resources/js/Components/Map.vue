<template>
    <div id="map"></div>
    <ShipLayer :mapInstance="map" v-if="mapIsReady" />
</template>

<script>
import ShipLayer from "@/Components/ShipLayer.vue";
import MapHelper from "@/Helpers/MapHelper";
import "maplibre-theme/icons.lucide.css";
import "maplibre-theme/classic.css";
import { mapState, mapActions } from "vuex";

// Map styles with URLs and image paths
const mapStyles = {
    "carto-positron": {
        code: "carto-positron",
        url: "https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json",
        image: "https://carto.com/help/images/building-maps/basemaps/positron_labels.png",
    },
    "carto-dark": {
        code: "carto-dark",
        url: "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json",
        image: "https://carto.com/help/images/building-maps/basemaps/dark_labels.png",
    },
    "carto-voyager": {
        code: "carto-voyager",
        url: "https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json",
        image: "https://carto.com/help/images/building-maps/basemaps/voyager_labels.png",
    },
};

export default {
    components: {
        ShipLayer,
    },

    props: {
        ship: Object, // Ship object
        realtimePosition: Object, // Real-time position object
    },

    data() {
        return {
            map: null,
            mapIsReady: false,
        };
    },

    computed: {
        // Mapping Vuex state to local computed properties
        ...mapState(["selectedShip"]),
    },

    watch: {
        // Watch for changes in the selected ship
        realtimePosition(newPosition) {
            if (!!newPosition && this.mapIsReady) {
                this.centerMapOnShip(newPosition);
            }
        },

        // Watch for changes in the selected ship
        selectedShip(newShip) {
            if (!!newShip && !!this.realtimePosition && this.mapIsReady) {
                this.centerMapOnShip(this.realtimePosition);
            }
        },
    },

    mounted() {
        this.initializeMap();
    },

    methods: {
        initializeMap() {
            // If the map is not initialized
            if (!this.map) {
                let zoom = 2;
                let center = [0, 0];
                let bearing = 0;

                // Create the map
                this.map = MapHelper.createMap("map", center, zoom, bearing);

                // Add the base layer
                MapHelper.addNavigationControl(this.map);

                // Add the base layer
                MapHelper.addGlobeProjectionControl(this.map);

                // Add the base layer
                this.map.on("load", async () => {
                    // Load the base layer
                    this.mapIsReady = true;

                    // Define the base layer
                    if (!!this.realtimePosition) {
                        this.centerMapOnShip(this.realtimePosition);
                    }

                    // Define the base layer
                    if (!!this.ship) {
                        this.setSelectedShip(this.ship);
                    }
                });
            }
        },

        // Center the map on the ship
        centerMapOnShip(position) {
            
            let geojson = JSON.parse(position.geojson);
            
            if (geojson && geojson.coordinates && geojson.coordinates.length === 2) {
                const [longitude, latitude] = geojson.coordinates;
                this.map.setCenter([longitude, latitude]);
                this.map.setZoom(17);
            }
        },

        // Add or update the ship
        ...mapActions(["addOrUpdateShip", "setSelectedShip"]),
    },
};
</script>

<style>
#map {
    height: 100%;
    width: 100%;
    background-color: #000;
}

.maplibregl-map {
    --ml-font-icons: maplibregl-icons-lucide;
}
</style>
