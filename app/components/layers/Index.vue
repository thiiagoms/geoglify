<template>
  <v-btn class="position-absolute font-weight-bold text-body-2 text--uppercase" style="top: 10px; left: 140px; z-index: 1000" size="small" @click="dialogOpened = true" prepend-icon="mdi-layers"> Layers </v-btn>
</template>

<script>
  import { GeoJsonLayer } from "@deck.gl/layers";
  import { MapboxOverlay } from "@deck.gl/mapbox";

  export default {
    props: ["map"],

    data() {
      return {
        layers: new Map(),
        overlay: new MapboxOverlay({
          interleaved: false,
          layers: [],
        }),
        lastIntervalTimestamp: 0
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
        let features = this.$store.state.layers.list.find((l) => l.id === id).features;

        let data = {
          type: "FeatureCollection",
          features: JSON.parse(JSON.stringify(features)),
        };

        let layer = new GeoJsonLayer({
          id: "layer-" + id,
          data: data,
          filled: true,
          pointRadiusMinPixels: 5,
          pointRadiusMaxPixels: 200,
          opacity: 0.4,
          pointRadiusScale: 1,
          getRadius: 50,
          getLineWidth: 20,
          getFillColor: [255, 0, 0, 255],
          autoHighlight: true,
          transitions: {
            getRadius: {
              type: "spring",
              stiffness: 0.1,
              damping: 0.15,
              enter: () => [0], // grow from size 0,
              duration: 10000,
            },
          },
        });

        this.layers.set(id, layer);

        this.updateOverlay();
      },


      // Remove a layer from the map
      removeLayer(id) {

        this.layers.delete(id);

        this.updateOverlay();

      },

      // Update the overlay with the current layers
      updateOverlay() {
        this.overlay.setProps({
          layers: Array.from(this.layers.values()),
        });
      },
    },

    async mounted() {
      // Add the overlay to the map
      this.map.addControl(this.overlay);
    },
  };
</script>
