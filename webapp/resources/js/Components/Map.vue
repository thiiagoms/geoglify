<script>
import ShipLayer from "@/Components/ShipLayer.vue";
import MapHelper from "@/Helpers/MapHelper";
import "maplibre-theme/icons.lucide.css";
import "maplibre-theme/classic.css";
import { StyleFlipperControl } from "maplibre-gl-style-flipper";

// Map styles with URLs and image paths
const mapStyles = {
    "carto-positron": {
        code: "carto-positron",
        url: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
        image: "https://carto.com/help/images/building-maps/basemaps/positron_labels.png",
    },
    "carto-dark": {
        code: "carto-dark",
        url: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
        image: "https://carto.com/help/images/building-maps/basemaps/dark_labels.png",
    },
    "carto-voyager": {
        code: "carto-voyager",
        url: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
        image: "https://carto.com/help/images/building-maps/basemaps/voyager_labels.png",
    },
};

export default {
    components: {
        ShipLayer,
    },

    data() {
        return {
            map: null,
            mapIsReady: false,
        };
    },

    mounted() {
        this.initializeMap();
    },

    methods: {
        initializeMap() {
            // Check if the map instance is already created
            if (!this.map) {
                let zoom = 15;
                let center = [-8.694322, 41.187891];
                let bearing = -37.5;
                // Create the map instance
                this.map = MapHelper.createMap("map", center, zoom, bearing);

                // Add navigation control
                MapHelper.addNavigationControl(this.map);

                // Add globe projection control
                MapHelper.addGlobeProjectionControl(this.map);

                // Check if the map is loaded and do something
                this.map.on("load", async () => {
                    // Create style control
                    const styleControl = new StyleFlipperControl(mapStyles);

                    // Set the initial style code (default style)
                    styleControl.setCurrentStyleCode(
                        Object.values(mapStyles)[0].code
                    );

                    // Add style control to the map
                    this.map.addControl(styleControl, "bottom-left");

                    // Set the map as ready
                    this.mapIsReady = true;
                });
            }
        },
    },
};
</script>

<template>
    <div id="map"></div>

    <ShipLayer :mapInstance="map" v-if="mapIsReady" />
</template>

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
