<template>
  <div id="map" class="map"></div>
</template>

<script>
const nuxtApp = useNuxtApp();
import { io } from "socket.io-client";
import { Deck, FlyToInterpolator } from "@deck.gl/core";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { ref, nextTick } from "vue";
import { IconLayer, TextLayer, GeoJsonLayer } from "@deck.gl/layers";
import {
  CollisionFilterExtension,
  PathStyleExtension,
  FillStyleExtension,
} from "@deck.gl/extensions";

const config = useRuntimeConfig();

// Mapbox API token
mapboxgl.accessToken = config.public.MAPBOX_TOKEN;

// Default map parameters
const DEFAULT_MAP_CENTER = [-5.5636312, 39.8814199];
const DEFAULT_MAP_BEARING = 0;
const DEFAULT_MAP_ZOOM = 4;
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

// Map settings
const MAP_SETTINGS = {
  container: "map",
  style: "mapbox://styles/leoneldias/clokc8kkj006901plhqene71o",
  projection: "mercator",
  interactive: false,
};

export default {
  data() {
    return {
      socket: null,
      messageBuffer: [],
      bufferInterval: null,
    };
  },

  setup() {
    const currentViewState = ref(null);
    const deck = ref(null);
    const mapRef = ref(null);
    const shipsStoreInstance = shipsStore();
    const layersStoreInstance = layersStore();

    return {
      currentViewState,
      deck,
      mapRef,
      shipsStoreInstance,
      layersStoreInstance,
    };
  },

  watch: {
    // Watch for changes in the ships list and active layers list
    filteredShips() {
      this.drawLayers();
    },

    activeLayersList() {
      this.drawLayers();
    },

    selectedFeature() {
      this.drawLayers();
    },

    selectedShip(val) {
      if (val) {
        const longitude = val.location.coordinates[0];
        const latitude = val.location.coordinates[1];
        const zoom = 16;

        this.deck.setProps({
          viewState: {
            ...this.currentViewState,
            longitude,
            latitude,
            zoom,
            transitionDuration: 500,
            transitionInterpolator: new FlyToInterpolator(),
          },
        });
      }
    },
  },

  beforeDestroy() {
    clearInterval(this.bufferInterval);
  },

  computed: {
    filteredShips() {
      return [...this.shipsStoreInstance.filteredList.values()];
    },
    selectedShip() {
      return this.shipsStoreInstance.selectedShip;
    },
    selectedFeature() {
      return this.layersStoreInstance.selectedFeature;
    },
    activeLayersList() {
      return this.layersStoreInstance.activeLayersList;
    },
  },

  methods: {
    onSocketConnect() {
      // Log when the socket is connected and set up the message event handler
      this.log("Socket connected");
      this.socket.on("message", this.onSocketMessage);
    },

    onSocketDisconnect() {
      // Log when the socket is disconnected and remove the message event handler
      this.log("Socket disconnected");
      this.socket.off("message");
    },

    onSocketMessage(...args) {
      // Add the received message to the buffer for later processing
      this.messageBuffer.push(args[0]);
    },

    processMessageBatch() {
      // Process each message in the buffer and update ships data
      this.messageBuffer.forEach((msg) => {
        this.shipsStoreInstance.createOrReplaceShip(msg);
      });
      this.messageBuffer = [];
    },

    log(message) {
      // Log a formatted message with a timestamp
      console.info(`[${new Date()}] ${message}`);
    },

    drawLayers() {
      // Create and update the visualization layer

      // Create a new IconLayer for the AIS data
      const aisLayer = new IconLayer({
        id: "ais-layer",
        data: this.filteredShips,
        billboard: false,
        autoHighlight: true,
        highlightColor: [255, 234, 0],
        getIcon: (f) => ({
          url: f.icon,
          width: f.width,
          height: f.height,
          mask: true,
        }),
        getPosition: (f) => f.location.coordinates,
        getAngle: (f) => 360 - f.hdg,
        getSize: (f) => f.size,
        getColor: (f) =>
          f._id == this.selectedShip?._id ? [255, 234, 0, 255] : f.color,
        getCollisionPriority: (f) => f.priority,
        extensions: [new CollisionFilterExtension()],
        collisionGroup: "visualization",
        pickable: true,
        onClick: ({ object }) =>
          this.shipsStoreInstance.setSelectedShip(object),
        visible: true, // Add visibility condition based on your logic
      });

      // Create a new TextLayer for the ship names
      const legendLayer = new TextLayer({
        id: "text-layer",
        data: this.filteredShips,
        fontFamily: "Monaco, monospace",
        getPosition: (f) => f.location.coordinates,
        getText: (f) => "   " + f.name.trim(),
        getSize: (f) => 70,
        sizeMaxPixels: "12",
        opacity: 1,
        getTextAnchor: "start",
        sizeUnits: "meters",
        getAlignmentBaseline: "center",
        fontWeight: "bold",
        radiusUnits: "pixels",
        getColor: [255, 255, 255],
        extensions: [new CollisionFilterExtension()],
        collisionGroup: "visualization",
        visible: true, // Add visibility condition based on your logic
      });

      // foreach active layyer, get all features and create a GeoJsonLayer
      const geojsonLayers = [];

      this.activeLayersList.forEach((layer) => {
        let geojson;

        if (layer.type === "point") {
          geojson = this.getGeoJSONPointLayer(layer);
        } else if (layer.type === "line") {
          geojson = this.getGeoJSONLineLayer(layer);
        } else if (layer.type === "polygon") {
          geojson = this.getGeoJSONPolygonLayer(layer);
        }

        if (geojson) {
          geojsonLayers.push(geojson);
        }
      });

      let layers = Object.freeze(geojsonLayers.concat([aisLayer, legendLayer]));

      if (this.deck)
        this.deck.setProps({
          layers,
        });

      this.activeLayersList.forEach((layer) => {
        this.layersStoreInstance.setStateLoadingLayer(layer._id, false);
      });
    },

    getGeoJSONPointLayer(layer) {
      return new GeoJsonLayer({
        id: layer._id,
        data: [...layer.features],
        pickable: true,
        filled: true,
        getPointRadius: layer.style?.radius || 4,
        getLineColor: this.hexToRgbaArray(layer.style?.lineColor),
        getLineWidth: layer.style?.lineWidth || 5,
        lineWidthUnits: "pixels",
        pointRadiusUnits: "pixels",
        getDashArray: layer.style?.dashArray?.split(",").map(Number) || [0, 0],
        autoHighlight: true,
        highlightColor: [255, 234, 0, 125],
        getFillColor: (f) =>
          f._id == this.selectedFeature?._id
            ? [255, 234, 0, 255]
            : this.hexToRgbaArray(layer.style?.fillColor),
        onClick: ({ object }) => {
          this.layersStoreInstance.setSelectedFeature(object);
        },
        updateTriggers: {
          getPointRadius: layer.style?.radius,
          getFillColor: [layer.style?.fillColor, this.selectedFeature],
          getLineColor: layer.style?.lineColor,
          getLineWidth: layer.style?.lineWidth,
        },
      });
    },

    getGeoJSONLineLayer(layer) {
      return new GeoJsonLayer({
        id: layer._id,
        data: [...layer.features],
        pickable: true,
        getLineWidth: layer.style?.lineWidth || 5,
        lineWidthUnits: "pixels",
        autoHighlight: true,
        highlightColor: [255, 234, 0, 125],
        getLineColor: (f) =>
          f._id == this.selectedFeature?._id
            ? [255, 234, 0, 255]
            : this.hexToRgbaArray(layer.style?.lineColor),
        onClick: ({ object }) => {
          this.layersStoreInstance.setSelectedFeature(object);
        },
        getDashArray: layer.style?.dashArray?.split(",").map(Number) || [0, 0],
        dashJustified: true,
        dashGapPickable: true,
        extensions: [new PathStyleExtension({ dash: true })],
        updateTriggers: {
          getLineColor: [layer.style?.lineColor, this.selectedFeature],
          getLineWidth: layer.style?.lineWidth,
          getDashArray: layer.style?.dashArray,
        },
      });
    },

    getGeoJSONPolygonLayer(layer) {
      return new GeoJsonLayer({
        id: layer._id,
        data: [...layer.features],
        pickable: true,
        stroked: true,
        filled: true,
        extruded: false,
        autoHighlight: true,
        highlightColor: [255, 234, 0, 125],
        getFillColor: (f) =>
          f._id == this.selectedFeature?._id
            ? [255, 234, 0, 255]
            : this.hexToRgbaArray(layer.style?.fillColor),
        getLineColor: this.hexToRgbaArray(layer.style?.lineColor),
        getLineWidth: layer.style?.lineWidth || 5,
        lineWidthUnits: "pixels",
        onClick: ({ object }) => {
          this.layersStoreInstance.setSelectedFeature(object);
        },

        //props added by PathStyleExtension
        getDashArray: layer.style?.dashArray?.split(",").map(Number) || [0, 0],
        dashJustified: true,
        dashGapPickable: true,

        // props added by FillStyleExtension
        fillPatternAtlas: "./patterns/patterns.png",
        fillPatternMapping: "./patterns/patterns.json",
        getFillPattern: (f) => layer.style?.fillPattern,
        getFillPatternScale: (f) => 100,
        getFillPatternOffset: (f) => [0, 0],

        extensions: [
          new PathStyleExtension({ dash: true }),
          new FillStyleExtension({
            pattern:
              !!layer.style?.fillPattern && layer.style?.fillPattern !== "none",
          }),
        ],

        updateTriggers: {
          getFillColor: [layer.style?.fillColor, this.selectedFeature],
          getLineColor: layer.style?.lineColor,
          getLineWidth: layer.style?.lineWidth,
          getDashArray: layer.style?.dashArray,
          getFillPattern: layer.style?.fillPattern,
          getFillPatternScale: layer.style?.fillPatternScale,
          getFillPatternOffset: layer.style?.fillPatternOffset,
        },
      });
    },

    initializeDeck() {
      this.deck = new Deck({
        width: "100%",
        height: "100%",
        parent: document.getElementById("map"),
        layers: [],
        viewState: this.currentViewState,
        onViewStateChange: ({ viewState }) => {
          // Update the current view state and synchronize with Mapbox GL map
          this.currentViewState = viewState;
          this.deck.setProps({ viewState: this.currentViewState });

          // Synchronize Mapbox GL map with Deck GL view state
          this.mapRef.jumpTo({
            center: [viewState.longitude, viewState.latitude],
            zoom: viewState.zoom,
            bearing: viewState.bearing,
            pitch: viewState.pitch,
          });
        },
        controller: true,
      });
    },

    hexToRgbaArray(hex) {
      if (!hex) return [223, 149, 13, 255]; // Return orange with alpha 255 if no color is defined

      // If hex is in #rrggbb format, append 'ff' for the alpha channel
      if (hex.length === 7) {
        hex += "ff";
      }

      // Parse hexadecimal values to decimal for each color channel and alpha channel
      const r = parseInt(hex.substring(1, 3), 16);
      const g = parseInt(hex.substring(3, 5), 16);
      const b = parseInt(hex.substring(5, 7), 16);
      const a = parseInt(hex.substring(7, 9), 16); // Alpha from 0 to 255

      // Return array with values [r, g, b, a]
      return [r, g, b, a];
    },
  },

  async mounted() {
    this.shipsStoreInstance.fetchShips().then(async () => {
      this.socket = io(this.$config.public.REALTIME_URL);
      this.socket.on("connect", this.onSocketConnect);
      this.socket.on("disconnect", this.onSocketDisconnect);
      this.bufferInterval = setInterval(this.processMessageBatch, 5000);
      await nuxtApp.callHook('ships:ready');
    });

    await nextTick();

    // Set the current view state to the initial view state
    this.currentViewState = { ...INITIAL_VIEW_STATE };

    // Create a Mapbox GL map
    this.mapRef = new mapboxgl.Map({
      ...MAP_SETTINGS,
      center: [this.currentViewState.longitude, this.currentViewState.latitude],
      zoom: this.currentViewState.zoom,
      bearing: this.currentViewState.bearing,
      pitch: this.currentViewState.pitch,
    });

    // Create a Deck GL instance for data visualization
    this.initializeDeck();
  },
};
</script>

<style scoped>
.map {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
