<template>
  <div id="map" class="map"></div>
  <AisShips v-if="!!ready" :map="map"></AisShips>
</template>
<script>
  import { Deck, MapView, FlyToInterpolator } from "@deck.gl/core";
  import maplibregl from "maplibre-gl";
  import "maplibre-gl/dist/maplibre-gl.css";

  // Base maps switcher plugin
  import BasemapsControl from "maplibre-gl-basemaps";
  import "maplibre-gl-basemaps/lib/basemaps.css";

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
        ready: false,
        map: null,
        deck: null,
        currentViewState: { ...INITIAL_VIEW_STATE },
        basemaps: [
          {
            id: "geoglify_mapbox",
            name: "Geoglify Mapbox",
            tiles: ["https://api.mapbox.com/styles/v1/leoneldias/clokc8kkj006901plhqene71o/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibGVvbmVsZGlhcyIsImEiOiJjbGV5ZjhiNXMxaHYwM3dta2phanp3ajhxIn0.XQtv4xNQ9x4H99AIcpJW7g"],
            sourceExtraParams: {
              tileSize: 256,
              attribution: `Map data &copy ${new Date().getFullYear()} Mapbox`,
              minzoom: 0,
              maxzoom: 20,
            },
          },
          {
            id: "google_road",
            name: "Google Road",
            tiles: ["https://mt.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&s=Ga"],
            sourceExtraParams: {
              tileSize: 256,
              attribution: `Map data &copy ${new Date().getFullYear()} Google`,
              minzoom: 0,
              maxzoom: 20,
            },
          },
          {
            id: "google_sat",
            name: "Google Sat",
            tiles: ["https://mt.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&s=Ga"],
            sourceExtraParams: {
              tileSize: 256,
              attribution: `Map data &copy ${new Date().getFullYear()} Google`,
              minzoom: 0,
              maxzoom: 20,
            },
          },
          {
            id: "light",
            name: "light",
            tiles: ["https://a.basemaps.cartocdn.com/rastertiles/light_nolabels/{z}/{x}/{y}.png"],
            sourceExtraParams: {
              tileSize: 256,
              attribution: `Map data &copy; OSM ${new Date().getFullYear()} CartoDB`,
              minzoom: 0,
              maxzoom: 19,
            },
          },
          {
            id: "dark",
            name: "dark",
            tiles: ["https://a.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}.png"],
            sourceExtraParams: {
              tileSize: 256,
              attribution: `Map data &copy; OSM ${new Date().getFullYear()} CartoDB`,
              minzoom: 0,
              maxzoom: 19,
            },
          },
          {
            id: "osm",
            name: "Open Street Map",
            tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
            sourceExtraParams: {
              tileSize: 256,
              attribution: "&copy; OpenStreetMap Contributors",
              minzoom: 0,
              maxzoom: 19,
            },
          },
        ],
      };
    },

    methods: {},

    async mounted() {
      // Create a Mapbox GL map
      this.map = new maplibregl.Map({
        container: "map",
        style: {
          version: 8,
          sources: {},
          layers: [],
          glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
        },
        antialias: true,
        center: [this.currentViewState.longitude, this.currentViewState.latitude],
        zoom: this.currentViewState.zoom,
        bearing: this.currentViewState.bearing,
        pitch: this.currentViewState.pitch,
        maxPitch: 0,
      });

      // Add geolocate control to the map.
      this.map.addControl(
        new maplibregl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true,
          },
          trackUserLocation: true,
        })
      );

      this.map.addControl(new maplibregl.NavigationControl(), "top-right");

      // Add the basemap control to the map
      this.baseMapControl = new BasemapsControl({
        basemaps: this.basemaps,
        initialBasemap: "google_road",
        expandDirection: "bottom",
      });

      this.map.addControl(this.baseMapControl, "top-right");

      while (!this.map.loaded()) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      this.ready = true;

      // Add the fullscreen control to the map
      this.map.addControl(new maplibregl.FullscreenControl(), "top-right");
    },
  };
</script>
<style>
  .map {
    height: calc(100vh - 64px - 24px - 48px);
    width: 100%;
  }

  .maplibregl-ctrl-basemaps .basemap {
    width: 29px !important;
    height: 29px !important;
    margin: 0px !important;
    margin-left: 4px !important;
    border-radius: 5px !important;
    border: 1px solid white !important;
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
    padding: 1px;
    background: white;
  }

  .maplibregl-ctrl-basemaps .basemap.active {
    border: 1px solid white !important;
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
  }
</style>
