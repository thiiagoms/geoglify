<template>
  <div id="map" class="map"></div>
</template>

<script>
const nuxtApp = useNuxtApp();
import { io } from "socket.io-client";
import { Deck, MapView, FlyToInterpolator } from "@deck.gl/core";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { ref, nextTick } from "vue";
import {
  IconLayer,
  TextLayer,
  GeoJsonLayer,
  ScatterplotLayer,
} from "@deck.gl/layers";

import { EditableGeoJsonLayer } from "@nebula.gl/layers";
import { MeasureDistanceMode } from "@nebula.gl/edit-modes";

import { _WMSLayer as WMSLayer } from "@deck.gl/geo-layers";

import {
  CollisionFilterExtension,
  PathStyleExtension,
  FillStyleExtension,
} from "@deck.gl/extensions";

const config = useRuntimeConfig();

// Mapbox API token
mapboxgl.accessToken = config.public.MAPBOX_TOKEN;

// Default map parameters
const DEFAULT_MAP_CENTER = [0, 0];
const DEFAULT_MAP_BEARING = 0;
const DEFAULT_MAP_ZOOM = 1;
const DEFAULT_MAP_PITCH = 0;
const ZOOM_AIS_THRESHOLD = 14;

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
      last: 0,
    };
  },

  setup() {
    const currentViewState = ref(null);
    const deck = ref(null);
    const mapRef = ref(null);
    const shipsStoreInstance = shipsStore();
    const layersStoreInstance = layersStore();
    const wmsLayersStoreInstance = wmsLayersStore();

    return {
      currentViewState,
      deck,
      mapRef,
      shipsStoreInstance,
      layersStoreInstance,
      wmsLayersStoreInstance,
    };
  },

  watch: {
    // Watch for changes in the ships list and active layers list
    filteredShips: {
      handler(val, oldVal) {
        if (val != oldVal) this.drawLayers();
      },
      deep: true,
    },

    activeLayersList() {
      this.drawLayers();
    },

    activeWmsLayersList() {
      this.drawLayers();
    },

    selectedFeature() {
      this.drawLayers();
    },

    filteredFeatures() {
      this.drawLayers();
    },
  },

  beforeDestroy() {
    clearInterval(this.bufferInterval);
  },

  computed: {
    filteredShips() {
      return this.shipsStoreInstance.filteredList;
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
    activeWmsLayersList() {
      return this.wmsLayersStoreInstance.activeLayersList;
    },
    filteredFeatures() {
      return this.layersStoreInstance.filteredFeaturesList;
    },
    layerIdToView() {
      return this.layersStoreInstance.layerIdToView;
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
      if (this.messageBuffer.length > 0) {
        this.shipsStoreInstance.createOrReplaceShips(this.messageBuffer);
        this.messageBuffer = [];
      }
    },

    log(message) {
      // Log a formatted message with a timestamp
      console.info(`[${new Date()}] ${message}`);
    },

    drawLayers() {
      // create a new GeojsonLayer for the AIS data
      const aisGeoJSONLayer = new GeoJsonLayer({
        id: "aisgeojson-layer",
        data: this.filteredShips.map((v) => v.geojson),
        pickable: true,
        filled: true,
        getFillColor: (f) => f.properties.color,
        lineJointRounded: true,
        lineCapRounded: true,
        visible: this.mapRef.getZoom() > ZOOM_AIS_THRESHOLD,
        autoHighlight: true,
        highlightColor: [255, 234, 0],
        onClick: ({ object }) => {
          this.shipsStoreInstance.setSelectedShip(object.properties);
        },
      });

      const antennaLayer = new ScatterplotLayer({
        id: "antenna-layer",
        data: this.filteredShips,
        pickable: true,
        opacity: 0.8,
        stroked: true,
        filled: false,
        lineWidthMinPixels: 4,
        getPosition: (f) => f.location.coordinates,
        sizeUnits: "meters",
        getRadius: (d) => 1,
        getLineColor: (d) => [255, 255, 255],
        visible: this.mapRef.getZoom() > ZOOM_AIS_THRESHOLD,
      });

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
        getAngle: (f) => 360 - f.geojson.properties.hdg,
        getSize: (f) => f.size,
        getColor: (f) =>
          f._id == this.selectedShip?._id
            ? [255, 234, 0, 255]
            : f.geojson.properties.color,
        getCollisionPriority: (f) => f.geojson.properties.priority,
        extensions: [new CollisionFilterExtension()],
        collisionGroup: "visualization",
        pickable: true,
        visible: this.mapRef.getZoom() <= ZOOM_AIS_THRESHOLD,
        onClick: ({ object }) =>
          this.shipsStoreInstance.setSelectedShip(object.geojson.properties),
      });

      // Create a new TextLayer for the ship names
      const legendLayer = new TextLayer({
        id: "aislegend-layer",
        data: this.filteredShips,
        fontFamily: "Nunito",
        getPosition: (f) => f.location.coordinates,
        getText: (f) =>
          !!f.geojson?.properties?.shipname
            ? f.geojson.properties.shipname.trim()
            : "N/A",
        getColor: [255, 255, 255, 255],
        getSize: 12,
        getTextAnchor: "start",
        getPixelOffset: [15, 0],
        getAngle: (f) => 0,
        fontWeight: "bold",
      });

      // foreach active layyer, get all features and create a GeoJsonLayer
      const geojsonLayers = [];

      this.activeLayersList.forEach((layer) => {
        let geojson;
        let data = [...layer.features];

        if (this.layerIdToView == layer._id) {
          data = data.filter((f) =>
            this.filteredFeatures.map((x) => x.id).includes(f._id)
          );
        }

        if (layer.type === "point") {
          geojson = this.getGeoJSONPointLayer(layer, data);
        } else if (layer.type === "line") {
          geojson = this.getGeoJSONLineLayer(layer, data);
        } else if (layer.type === "polygon") {
          geojson = this.getGeoJSONPolygonLayer(layer, data);
        }

        if (geojson) {
          geojsonLayers.push(geojson);
        }
      });

      let layers = geojsonLayers.concat([
        aisGeoJSONLayer,
        antennaLayer,
        aisLayer,
        legendLayer,
        //ruler,
      ]);

      this.activeWmsLayersList.forEach((wms_layer) => {
        const wms = new WMSLayer({
          data: wms_layer.url + "&WIDTH={width}&HEIGHT={height}&BBOX={bbox}",
          serviceType: "template",
          layers: wms_layer.layers.split(","),
          opacity: 0.5,
        });

        layers.unshift(wms);
      });

      if (this.deck) {
        this.deck.setProps({
          layers: layers,
        });
        this.toggleLayerVisibilty();
      }

      this.activeLayersList.forEach((layer) => {
        this.layersStoreInstance.setStateLoadingLayer(layer._id, false);
      });

      this.activeWmsLayersList.forEach((layer) => {
        this.wmsLayersStoreInstance.setStateLoadingLayer(layer._id, false);
      });
    },

    getGeoJSONPointLayer(layer, data) {
      return new GeoJsonLayer({
        id: layer._id,
        data: data,
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

    getGeoJSONLineLayer(layer, data) {
      return new GeoJsonLayer({
        id: layer._id,
        data: data,
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

    getGeoJSONPolygonLayer(layer, data) {
      return new GeoJsonLayer({
        id: layer._id,
        data: data,
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
        views: new MapView({
          repeat: true,
          // nearZMultiplier: 0.1,
          // farZMultiplier: 1.01,
          // orthographic: false,
        }),
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

          this.toggleLayerVisibilty();
        },
        controller: true,
      });
    },

    toggleLayerVisibilty() {
      //@todo: add a check if zoom level is changed between 11 and 13
      let layers = this.deck.props.layers.map((layer) => {
        if (this.mapRef.getZoom() > ZOOM_AIS_THRESHOLD) {
          if (layer.id === "ais-layer") {
            layer = layer.clone({ visible: false });
          }

          if (layer.id === "aisgeojson-layer") {
            layer = layer.clone({ visible: true });
          }

          if (layer.id === "antenna-layer") {
            layer = layer.clone({ visible: true });
          }

          if (layer.id === "aislegend-layer") {
            layer = layer.clone({ visible: true });
          }
        } else {
          if (layer.id === "ais-layer") {
            layer = layer.clone({ visible: true });
          }

          if (layer.id === "aisgeojson-layer") {
            layer = layer.clone({ visible: false });
          }

          if (layer.id === "antenna-layer") {
            layer = layer.clone({ visible: false });
          }

          if (layer.id === "aislegend-layer") {
            layer = layer.clone({ visible: false });
          }
        }

        return layer;
      });

      this.deck.setProps({ layers: layers });
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
      await nuxtApp.callHook("ships:ready");
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
