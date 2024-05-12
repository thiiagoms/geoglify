<template>
  <v-btn class="position-absolute font-weight-bold text-body-2 text--uppercase" style="top: 10px; left: 140px; z-index: 1000" size="small" @click="dialogOpened = true" prepend-icon="mdi-layers"> Layers </v-btn>
</template>

<script>
  import { GeoJsonLayer } from "@deck.gl/layers";
  import { MapboxOverlay } from "@deck.gl/mapbox";
  import { PathStyleExtension, FillStyleExtension } from "@deck.gl/extensions";
  import configs from "~/helpers/configs";

  export default {
    props: ["map"],

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
        },
        deep: true,
      },
    },

    methods: {
      // Add a layer to the map
      addLayer(id) {
        
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

        this.updateOverlay();
      },

      // Remove a layer from the map
      removeLayer(id) {
        const layer = this.$store.state.layers.list.find((l) => l.id === id);

        this.layers.delete(layer.id);

        this.updateOverlay();
      },

      // Update the overlay with the current layers
      updateOverlay() {

        this.overlay.setProps({
          layers: Array.from(this.layers.values()),
        });
      },

      // Get a GeoJSON point layer
      getGeoJSONPointLayer(layer, data) {
        return new GeoJsonLayer({
          id: "layer-" + layer.id,
          data: data,
          pickable: false,
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
        });
      },

      // Get a GeoJSON polygon layer
      getGeoJSONPolygonLayer(layer, data) {

        return new GeoJsonLayer({
          id: "layer-" + layer._id,
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
        });
      },
    },

    async mounted() {
      // Add the overlay to the map
      this.map.addControl(this.overlay);
    },
  };
</script>
