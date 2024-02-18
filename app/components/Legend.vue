<template>
  <div
    :id="`legend-${this.id}`"
    style="position: relative; width: 100%; height: 100%"
  ></div>
</template>

<script>
import { Deck } from "@deck.gl/core";
import { GeoJsonLayer } from "@deck.gl/layers";
import { PathStyleExtension, FillStyleExtension } from "@deck.gl/extensions";

export default {
  props: {
    id: String,
    style: Object,
    type: String,
  },

  data: () => ({
    deck: null,
  }),

  async mounted() {
    
    this.deck = new Deck({
      width: "100%",
      height: "100%",
      parent: document.getElementById(`legend-${this.id}`),
      initialViewState: {
        longitude: 0,
        latitude: 0,
        zoom: 1,
      },
      layers: [],
    });

    this.render();
  },

  watch: {
    style: {
      handler: "render",
      deep: true,
    },
  },

  methods: {
    render() {
      this.deck.setProps({ layers: [] });

      if (!!this.style) {
        switch (this.type) {
          case "point":
            this.renderPoint();
            break;
          case "line":
            this.renderLine();
            break;
          case "polygon":
            this.renderPolygon();
            break;
        }
      }
    },
    renderPoint() {
      const layer = new GeoJsonLayer({
        id: "point-layer-" + this.id,
        data: "./_pointSquare.geojson",
        stroked: true,
        filled: true,
        getPointRadius: this.style?.pointRadius > 8 ? this.style?.pointRadius : 8,
        getFillColor: this.hexToRgbaArray(this.style?.fillColor),
        getLineColor: this.hexToRgbaArray(this.style?.lineColor),
        getLineWidth: this.style?.lineWidth > 3 ? 3 : this.style?.lineWidth,
        lineWidthUnits: "pixels",
        pointRadiusUnits: "pixels",
        updateTriggers: {
          getFillColor: this.style?.fillColor,
          getLineColor: this.style?.lineColor,
        },
      });
      this.deck.setProps({ layers: [layer] });
    },
    renderLine() {
      const layer = new GeoJsonLayer({
        id: "line-layer-" + this.id,
        data: "./_lineSquare.geojson",
        stroked: true,
        filled: true,
        getLineColor: this.hexToRgbaArray(this.style?.lineColor),
        getLineWidth: this.style?.lineWidth > 7 ? 7 : this.style?.lineWidth,
        lineWidthUnits: "pixels",
        getDashArray: this.style?.dashArray?.split(",").map(Number) || [0, 0],
        dashJustified: true,
        dashGapPickable: true,
        extensions: [new PathStyleExtension({ dash: true })],
        updateTriggers: {
          getLineColor: this.style?.lineColor,
          getLineWidth: this.style?.lineWidth,
          getDashArray: this.style?.dashArray,
        },
      });
      this.deck.setProps({ layers: [layer] });
    },
    renderPolygon() {
      let layer = null;

      if (this.style?.fillPattern != "none") {
        layer = new GeoJsonLayer({
          id: "polygon-layer-" + this.id,
          data: "./_polygonSquare.geojson",
          stroked: true,
          filled: true,
          getFillColor: this.hexToRgbaArray(this.style?.fillColor),
          getLineColor: this.hexToRgbaArray(this.style?.lineColor),
          getLineWidth: this.style?.lineWidth > 3 ? 3 : this.style?.lineWidth,
          lineWidthUnits: "pixels",
          getDashArray: this.style?.dashArray?.split(",").map(Number) || [0, 0],
          dashJustified: true,
          dashGapPickable: true,
          getFillPatternEnabled: (f) => this.style?.fillPattern != "none",
          fillPatternAtlas: "./patterns/patterns.png",
          fillPatternMapping: "./patterns/patterns.json",
          fillPatternMask: true,
          getFillPattern: (f) => this.style?.fillPattern,
          getFillPatternScale: (f) => 100,
          getFillPatternOffset: (f) => [0, 0],
          extensions: [
            new PathStyleExtension({ dash: true }),
            new FillStyleExtension({
              pattern: this.style?.fillPattern != "none",
            }),
          ],
          updateTriggers: {
            getFillColor: this.style?.fillColor,
            getLineColor: this.style?.lineColor,
            getLineWidth: this.style?.lineWidth,
            getDashArray: this.style?.dashArray,
            getFillPattern: this.style?.fillPattern,
            getFillPatternScale: this.style?.fillPatternScale,
            getFillPatternOffset: this.style?.fillPatternOffset,
          },
        });
      } else {
        layer = new GeoJsonLayer({
          id: "polygon-layer-" + this.id,
          data: "./_polygonSquare.geojson",
          stroked: true,
          filled: true,
          getFillColor: this.hexToRgbaArray(this.style?.fillColor),
          getLineColor: this.hexToRgbaArray(this.style?.lineColor),
          getLineWidth: this.style?.lineWidth || 5,
          lineWidthUnits: "pixels",
          getDashArray: this.style?.dashArray?.split(",").map(Number) || [0, 0],
          dashJustified: true,
          dashGapPickable: true,
          extensions: [new PathStyleExtension({ dash: true })],
          updateTriggers: {
            getFillColor: this.style?.fillColor,
            getLineColor: this.style?.lineColor,
            getLineWidth: this.style?.lineWidth,
            getDashArray: this.style?.dashArray,
          },
        });
      }

      this.deck.setProps({ layers: [layer] });
    },
    hexToRgbaArray(hex) {
      if (!hex) return [223, 149, 13, 255];

      if (hex.length === 7) {
        hex += "ff";
      }

      const r = parseInt(hex.substring(1, 3), 16);
      const g = parseInt(hex.substring(3, 5), 16);
      const b = parseInt(hex.substring(5, 7), 16);
      const a = parseInt(hex.substring(7, 9), 16);

      return [r, g, b, a];
    },
  },
};
</script>
