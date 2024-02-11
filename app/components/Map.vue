<template>
  <div id="map" class="map"></div>
</template>

<script>
import { io } from "socket.io-client";
import { Deck, FlyToInterpolator } from "@deck.gl/core";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { ref, nextTick } from "vue";
import { IconLayer, TextLayer, GeoJsonLayer } from "@deck.gl/layers";
import { CollisionFilterExtension } from "@deck.gl/extensions";

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
      console.log("activeLayersList changed");
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
        getIcon: (d) => ({
          url: d.icon,
          width: d.width,
          height: d.height,
          mask: true,
        }),
        getPosition: (d) => d.location.coordinates,
        getAngle: (d) => 360 - d.hdg,
        getSize: (d) => d.size,
        getColor: (d) => d.color,
        getCollisionPriority: (d) => d.priority,
        extensions: [new CollisionFilterExtension()],
        collisionGroup: "visualization",
        pickable: true,
        onClick: ({ object, x, y }) =>
          this.shipsStoreInstance.setSelectedShip(object),
        visible: true, // Add visibility condition based on your logic
      });

      // Create a new TextLayer for the ship names
      const legendLayer = new TextLayer({
        id: "text-layer",
        data: this.filteredShips,
        fontFamily: "Monaco, monospace",
        getPosition: (d) => d.location.coordinates,
        getText: (d) => "   " + d.name.trim(),
        getSize: (d) => 70,
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
        let geojson = new GeoJsonLayer({
          id: layer._id,
          data: [...layer.features],
          pickable: false,
          stroked: true,
          filled: true,
          extruded: false,
          getFillColor: layer.style?.getFillColor || [255, 0, 0, 125],
          getLineColor: layer.style?.getFillColor || [0, 0, 0, 255],
          getLineWidth: layer.style?.getLineWidth || 4,
          lineWidthUnits: "pixels",
        });

        geojsonLayers.push(geojson);
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
  },

  async mounted() {
    this.shipsStoreInstance.fetchShips().then(() => {
      this.socket = io(this.$config.public.REALTIME_URL);
      this.socket.on("connect", this.onSocketConnect);
      this.socket.on("disconnect", this.onSocketDisconnect);
      this.bufferInterval = setInterval(this.processMessageBatch, 5000);
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
