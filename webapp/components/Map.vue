<template>
  <div id="map" class="map"></div>
</template>
<script>
  import { Deck, MapView, FlyToInterpolator } from "@deck.gl/core";
  import maplibregl from "maplibre-gl";
  import "maplibre-gl/dist/maplibre-gl.css";

  // Default map parameters
  const DEFAULT_MAP_CENTER = [0, 0];
  const DEFAULT_MAP_BEARING = 0;
  const DEFAULT_MAP_ZOOM = 1;
  const DEFAULT_MAP_PITCH = 0;

  // Initial view state for the map
  const INITIAL_VIEW_STATE = {
    latitude: DEFAULT_MAP_CENTER[1],
    longitude: DEFAULT_MAP_CENTER[0],
    zoom: DEFAULT_MAP_ZOOM,
    bearing: DEFAULT_MAP_BEARING,
    pitch: DEFAULT_MAP_PITCH,
    transitionDuration: "auto",
  };

  export default {
    data() {
      return {
        map: null,
        deck: null,
        currentViewState: { ...INITIAL_VIEW_STATE },
      };
    },

    methods: {},

    async mounted() {
      // Create a Mapbox GL map
      this.mapRef = new maplibregl.Map({
        container: "map",
        style: "https://demotiles.maplibre.org/style.json",
        center: [this.currentViewState.longitude, this.currentViewState.latitude],
        zoom: this.currentViewState.zoom,
        bearing: this.currentViewState.bearing,
        pitch: this.currentViewState.pitch,
      });

      // Add geolocate control to the map.
      this.mapRef.addControl(
        new maplibregl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true,
          },
          trackUserLocation: true,
        })
      );

      this.mapRef.addControl(new maplibregl.NavigationControl(), "top-right");
    },
  };
</script>
<style>
  .map {
    height: 100%;
    width: 100%;
  }
</style>
