<template>
  <div id="map" ref="mapDiv" class="map"></div>
</template>

<script>
import { onMounted, onBeforeUnmount } from 'vue';
import { Deck } from "@deck.gl/core";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { ref, nextTick } from "vue";
import { IconLayer, TextLayer } from "@deck.gl/layers";
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
  props: ["idx"],
  emits: ["update:idx"],

  setup() {
    const currentViewState = ref(null);
    const deck = ref(null);
    const mapRef = ref(null);
    const ships = shipsStore();
    const mapDiv = ref(null);

    return { currentViewState, deck, mapRef, ships, mapDiv};
  },

  watch: {
    shipsList(val) {
      this.setupLayers(val);
    }
  },

  computed: {
    shipsList() {
      return [...this.ships?.list?.values()];
    },
  },

  methods: {
    setupLayers(data) {
      // Create and update the visualization layer
      const aisLayer = new IconLayer({
        id: "ais-layer",
        data,
        billboard: false,
        getIcon: (d) => ({
          url: d.icon,
          width: 41,
          height: 96,
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
        onClick: ({ object, x, y }) => this.ships.setSelected(object),
      });

      let legendLayer = new TextLayer({
        id: "text-layer",
        data,
        fontFamily: "Monaco, monospace",
        getPosition: (d) => d.location.coordinates,
        getText: (d) => "   " + d.ship_name.trim(),
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
      });

      let layers = Object.freeze([aisLayer, legendLayer]);

      if (this.deck)
        this.deck.setProps({
          layers,
        });
    },

    initializeDeck() {
      this.deck = new Deck({
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
