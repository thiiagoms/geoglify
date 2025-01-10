<script>
import MapHelper from "@/Helpers/MapHelper";
import { StyleControl } from "@/Helpers/StyleControl";
import "maplibre-gl/dist/maplibre-gl.css";

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
    props: ["mapInstance"],

    data() {
        return {
            mapRef: this.mapInstance,
        };
    },

    mounted() {
        this.initializeMap();
    },

    methods: {
        initializeMap() {
            // Check if the map instance is already created
            if (!this.mapRef) {
                // Get the first style in the mapStyles object as the default style
                const defaultStyle = Object.values(mapStyles)[0];

                // Create the map with the default style
                this.mapRef = MapHelper.createMap("map", defaultStyle.url);
            }

            // Add navigation control
            MapHelper.addNavigationControl(this.mapRef);

            // Add globe projection control
            MapHelper.addGlobeProjectionControl(this.mapRef);

            // Check if the map is loaded and do something
            this.mapRef.on("load", async () => {
                // Emit the map instance to the parent component
                this.$emit("map-instance-created", this.mapRef);

                // Create style control
                const styleControl = new StyleControl(mapStyles, (styleClass, styleCode) => {
                    console.log(`Style changed to: ${styleClass} (${styleCode})`);
                });

                // Set the initial style code (default style)
                styleControl.setCurrentStyleCode(Object.values(mapStyles)[0].code);

                // Add style control to the map
                this.mapRef.addControl(styleControl, "bottom-left");
            });
        },
    },
};
</script>

<template>
    <div id="map"></div>
</template>

<style>
#map {
    height: 100%;
    width: 100%;
    background-color: #000;
}
</style>
