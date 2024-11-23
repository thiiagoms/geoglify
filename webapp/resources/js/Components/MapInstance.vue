<script>
import MapHelper from "@/Helpers/MapHelper";

import "maplibre-gl/dist/maplibre-gl.css";

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
                this.mapRef = MapHelper.createMap("map");
            }

            // Add navigation control
            MapHelper.addNavigationControl(this.mapRef);

            // Check if the map is loaded and do somethings
            this.mapRef.on("load", async () => {
                // Emit the map instance to the parent component
                this.$emit("map-instance-created", this.mapRef);
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
}
</style>
