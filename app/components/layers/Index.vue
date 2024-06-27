<template>
  <v-btn class="position-absolute" style="top: 10px; left: 80px; z-index: 1000" density="comfortable" rounded="lg"
    size="small" @click="dialogOpened = true" icon="mdi-layers"></v-btn>
</template>

<script>
import { GeoJsonLayer } from "@deck.gl/layers";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { PathStyleExtension, FillStyleExtension } from "@deck.gl/extensions";
import configs from "~/helpers/configs";

export default {
  props: ["map", "tooltip"],

  data() {
    return {
      layers: new Map(),
      overlay: new MapboxOverlay({
        interleaved: false,
        layers: [],
      }),
      lastIntervalTimestamp: 0,
    };
  },

  beforeDestroy() {
    clearInterval(this.bufferInterval);
  },

  computed: {
    dialogOpened: {
      get() {
        return this.$store.state.layers.listOpened;
      },
      set(value) {
        this.$store.state.layers.listOpened = value;
      },
    },

    selected() {
      return JSON.parse(JSON.stringify(this.$store.state.layers.selected));
    },

    tooltipInfo: {
      get() {
        return this.tooltip;
      },
      set(value) {
        this.$emit("update:tooltip", value);
      },
    },
  },

  watch: {
    // Watch for changes in the selected layers
    selected: {
      handler: function (newLayers, oldLayers) {
        // Detect changes in the selected layers
        // Add layers with new IDs
        newLayers.forEach((newLayer) => {
          if (!oldLayers || !oldLayers.includes(newLayer)) {
            this.addLayer(newLayer);
          }
        });

        // Remove layers with IDs that no longer exist
        oldLayers.forEach((oldLayer) => {
          if (!newLayers || !newLayers.includes(oldLayer)) {
            this.removeLayer(oldLayer);
          }
        });

        // Remove and Add layers
        newLayers.forEach((newLayer) => {
          if (oldLayers.includes(newLayer)) {
            this.removeLayer(newLayer);
            this.addLayer(newLayer);
          }
        });
      },
      deep: true,
    },
  },

  methods: {
    // Add a layer to the map
    addLayer(id) {

      if (this.map.getLayer("layer-geoglify-" + id))
        this.map.removeLayer("layer-geoglify-" + id);

      if (this.map.getSource("layer-geoglify-" + id))
        this.map.removeSource("layer-geoglify-" + id);

      this.map.addSource("layer-geoglify-" + id, {
        type: 'vector',
        url: 'http://localhost:3001/geoglify_data?layer_id=' + id
      });

      let randomColorHexString = '#' + (Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');

      this.map.addLayer({
        'id': "layer-geoglify-" + id,
        'type': 'fill',
        'source': "layer-geoglify-" + id,
        'source-layer': 'geoglify_data',
        paint: {
          "fill-color": randomColorHexString,
          "fill-opacity": 0.8,
          "fill-outline-color": "#000000"
        },
      });

      /*
      const layer = this.$store.state.layers.list.find((l) => l.id === id);

      let features = layer.features;

      let data = {
        type: "FeatureCollection",
        features: JSON.parse(JSON.stringify(features)),
      };

      let geojsonLayer = null;

      if (layer.type === "point") {
        geojsonLayer = this.getGeoJSONPointLayer(layer, data);
      } else if (layer.type === "line") {
        geojsonLayer = this.getGeoJSONLineLayer(layer, data);
      } else if (layer.type === "polygon") {
        geojsonLayer = this.getGeoJSONPolygonLayer(layer, data);
      }

      this.layers.set(layer.id, geojsonLayer);
*/
      this.updateOverlay();
    },

    // Remove a layer from the map
    removeLayer(id) {
      //const layer = this.$store.state.layers.list.find((l) => l.id === id);

      //this.layers.delete(layer.id);

      if (this.map.getLayer("layer-geoglify-" + id))
        this.map.removeLayer("layer-geoglify-" + id);

      if (this.map.getSource("layer-geoglify-" + id))
        this.map.removeSource("layer-geoglify-" + id);

      this.updateOverlay();
    },

    // Update the overlay with the current layers
    updateOverlay() {
      this.overlay.setProps({
        layers: Array.from(this.layers.values()),
      });

      this.selected.forEach((id) => {
        this.$store.dispatch("layers/SET_LAYER_LOADING", { layerId: id, loading: false });
      });
    },

    // Get a GeoJSON point layer
    getGeoJSONPointLayer(layer, data) {
      return new GeoJsonLayer({
        id: "layer-" + layer.id,
        data: data,
        pickable: true,
        filled: true,
        getPointRadius: layer.style?.radius || 4,
        getLineColor: configs.hexToRgbaArray(layer.style?.lineColor),
        getLineWidth: layer.style?.lineWidth || 5,
        lineWidthUnits: "pixels",
        pointRadiusUnits: "pixels",
        getDashArray: layer.style?.dashArray?.split(",").map(Number) || [0, 0],
        autoHighlight: true,
        highlightColor: [255, 234, 0, 125],
        getFillColor: configs.hexToRgbaArray(layer.style?.fillColor),
        updateTriggers: {
          getPointRadius: layer.style?.radius,
          getFillColor: [layer.style?.fillColor, this.selectedFeature],
          getLineColor: layer.style?.lineColor,
          getLineWidth: layer.style?.lineWidth,
        },

        onClick: (event) => {
          // set the selected feature
          this.$store.dispatch("features/SET_SELECTED", event.object);

          // unset the selected ship
          this.$store.dispatch("ships/SET_SELECTED", null);

          return true;
        },

        onHover: (info) => this.showTooltip(info),
      });
    },

    // Get a GeoJSON line layer
    getGeoJSONLineLayer(layer, data) {
      return new GeoJsonLayer({
        id: "layer-" + layer.id,
        data: data,
        pickable: true,
        getLineWidth: layer.style?.lineWidth || 5,
        lineWidthUnits: "pixels",
        autoHighlight: true,
        highlightColor: [255, 234, 0, 125],
        getLineColor: configs.hexToRgbaArray(layer.style?.lineColor),
        getDashArray: layer.style?.dashArray?.split(",").map(Number) || [0, 0],
        dashJustified: true,
        dashGapPickable: true,
        extensions: [new PathStyleExtension({ dash: true })],
        updateTriggers: {
          getLineColor: [layer.style?.lineColor, this.selectedFeature],
          getLineWidth: layer.style?.lineWidth,
          getDashArray: layer.style?.dashArray,
        },

        onClick: (event) => {
          // set the selected feature
          this.$store.dispatch("features/SET_SELECTED", event.object);

          // unset the selected ship
          this.$store.dispatch("ships/SET_SELECTED", null);
          return true;
        },

        onHover: (info) => this.showTooltip(info),
      });
    },

    // Get a GeoJSON polygon layer
    getGeoJSONPolygonLayer(layer, data) {
      if (layer.style?.fillPattern === "none") {
        return new GeoJsonLayer({
          id: "layer-" + layer.id,
          data: data,
          pickable: true,
          stroked: true,
          filled: true,
          extruded: false,
          autoHighlight: true,
          highlightColor: [255, 234, 0, 125],
          getFillColor: configs.hexToRgbaArray(layer.style?.fillColor),
          getLineColor: configs.hexToRgbaArray(layer.style?.lineColor),
          getLineWidth: layer.style?.lineWidth || 5,
          lineWidthUnits: "pixels",
          getDashArray: layer.style?.dashArray?.split(",").map(Number) || [0, 0],
          dashJustified: true,
          dashGapPickable: true,
          extensions: [new PathStyleExtension({ dash: true })],
          updateTriggers: {
            getFillColor: [layer.style?.fillColor, this.selectedFeature],
            getLineColor: layer.style?.lineColor,
            getLineWidth: layer.style?.lineWidth,
            getDashArray: layer.style?.dashArray,
          },
          onClick: (event) => {
            // set the selected feature
            this.$store.dispatch("features/SET_SELECTED", event.object);

            // unset the selected ship
            this.$store.dispatch("ships/SET_SELECTED", null);
            return true;
          },
          onHover: (info) => this.showTooltip(info),
        });
      } else {
        return new GeoJsonLayer({
          id: "layer-" + layer.id,
          data: data,
          pickable: true,
          stroked: true,
          filled: true,
          extruded: false,
          autoHighlight: true,
          highlightColor: [255, 234, 0, 125],
          getFillColor: configs.hexToRgbaArray(layer.style?.fillColor),
          getLineColor: configs.hexToRgbaArray(layer.style?.lineColor),
          getLineWidth: layer.style?.lineWidth || 5,
          lineWidthUnits: "pixels",

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
              pattern: !!layer.style?.fillPattern && layer.style?.fillPattern !== "none",
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

          onClick: (event) => {
            //  set the selected feature
            this.$store.dispatch("features/SET_SELECTED", event.object);

            // unset the selected ship
            this.$store.dispatch("ships/SET_SELECTED", null);
            return true;
          },

          onHover: (info) => this.showTooltip(info),
        });
      }
    },

    showTooltip({ object, x, y }) {
      if (object) {
        this.tooltipInfo.style.display = "block";
        this.tooltipInfo.style.left = `${x}px`;
        this.tooltipInfo.style.top = `${y}px`;

        this.tooltipInfo.innerHTML = "";

        for (const [key, value] of Object.entries(object.properties)) {
          this.tooltipInfo.innerHTML += `<div><b>${key}</b>: ${value}</div>`;
        }
      } else {
        this.tooltipInfo.style.display = "none";
      }
    },
  },

  async mounted() {
    // Add the overlay to the map
    this.map.addControl(this.overlay);
  },
};
</script>
