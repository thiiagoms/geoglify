<script>
import PlannedRouteHelper from "@/Helpers/PlannedRouteHelper";
import MapHelper from "@/Helpers/MapHelper";

export default {
    props: ["mapInstance"],

    mounted() {
        if (this.mapInstance) {
            MapHelper.addSource(this.mapInstance, "plannedRouteSource");
            PlannedRouteHelper.addLayer(
                this.mapInstance,
                "plannedRouteLayer",
                "plannedRouteSource"
            );
        }
    },

    methods: {
        updatePlannedRoute(plannedGeojson) {
            MapHelper.updateSource(
                this.mapInstance,
                "plannedRouteSource",
                plannedGeojson
            );
        },
    },
};
</script>

<template>
    <div></div>
</template>
