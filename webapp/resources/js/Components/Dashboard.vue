<script>
import MapInstance from "@/Components/MapInstance.vue";
import ShipTable from "@/Components/ShipTable.vue";
import ShipDetails from "@/Components/ShipDetails.vue";
import PortLayer from "@/Components/PortLayer.vue";
import PlannedRouteLayer from "@/Components/PlannedRouteLayer.vue";
import RealRouteLayer from "@/Components/RealRouteLayer.vue";
import ShipLayer from "@/Components/ShipLayer.vue";
import SearouteLayer from "@/Components/SeaRouteLayer.vue";

export default {
    components: {
        MapInstance,
        ShipTable,
        ShipDetails,
        PortLayer,
        PlannedRouteLayer,
        RealRouteLayer,
        ShipLayer,
        SearouteLayer,
    },

    data: () => ({
        isShipListVisible: false,
        isShipDetailsVisible: false,
        activeShip: null,
        shipData: [],
        plannedGeojson: [],
        realGeojson: [],
        mapInstance: null,
    }),

    watch: {
        isShipDetailsVisible(value) {
            if (!value) {
                this.activeShip = null;
            }
        },
    },

    methods: {
        updateShipsOnMap(filteredShips) {
            this.$refs.shipLayer.updateShipsOnMap(filteredShips);
        },

        handleShipDetailsFetched({ plannedGeojson, realGeojson }) {
            this.plannedGeojson = plannedGeojson;
            this.realGeojson = realGeojson;
            this.$refs.plannedRouteLayer.updatePlannedRoute(plannedGeojson);
            this.$refs.realRouteLayer.updateRealRoute(realGeojson);
        },

        setMapInstance(instance) {
            this.mapInstance = instance;
        },

        highlightShip(mmsi) {
            this.activeShip = { mmsi };
            this.isShipDetailsVisible = true;
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

    <MapInstance
        :mapInstance="mapInstance"
        @map-instance-created="setMapInstance"
    >
    </MapInstance>

    <ShipLayer
        ref="shipLayer"
        :mapInstance="mapInstance"
        @ship-clicked="highlightShip"
    />
    <PlannedRouteLayer ref="plannedRouteLayer" :mapInstance="mapInstance" />
    <RealRouteLayer ref="realRouteLayer" :mapInstance="mapInstance" />
    <PortLayer :mapInstance="mapInstance" />
    <SearouteLayer :mapInstance="mapInstance" />

    <v-navigation-drawer
        v-model="isShipListVisible"
        location="bottom"
        permanent
    >
        <ShipTable
            v-if="isShipListVisible"
            :ships="shipData"
            @filtered-ships="updateShipsOnMap"
        />
    </v-navigation-drawer>

    <v-navigation-drawer
        width="450"
        v-model="isShipDetailsVisible"
        location="right"
        permanent
        floating
    >
        <ShipDetails
            v-if="isShipDetailsVisible"
            :key="activeShip.mmsi"
            :ship="activeShip"
            @close="isShipDetailsVisible = false"
            @ship-details-fetched="handleShipDetailsFetched"
        />
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
