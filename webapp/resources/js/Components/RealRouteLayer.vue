<script>
import RealRouteHelper from "@/Helpers/RealRouteHelper";
import MapHelper from "@/Helpers/MapHelper";

export default {
    props: ["mapInstance"],

    mounted() {
        if (this.mapInstance) {
            MapHelper.addSource(this.mapInstance, "realRouteSource");
            RealRouteHelper.addLayer(
                this.mapInstance,
                "realRouteLayer",
                "realRouteSource"
            );
        }
    },

    methods: {
        updateRealRoute(realGeojson) {
            MapHelper.updateSource(
                this.mapInstance,
                "realRouteSource",
                realGeojson
            );
        },
    },
};
</script>

<template>
    <div></div>
</template>
