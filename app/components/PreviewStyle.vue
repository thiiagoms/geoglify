<template>
  <div
    id="mapPreview"
    ref="mapPreview"
    style="position: relative; width: 100%; height: 100%"
  ></div>
</template>

<script>
import { Deck } from "@deck.gl/core";
import { GeoJsonLayer } from "@deck.gl/layers";
import { PathStyleExtension, FillStyleExtension } from "@deck.gl/extensions";

export default {
  props: {
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
      parent: document.getElementById("mapPreview"),
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
      } else {
        this.deck.setProps({ layers: [] });
      }
    },
    renderPoint() {
      const layer = new GeoJsonLayer({
        data: "./_point.geojson",
        stroked: true,
        filled: true,
        getPointRadius: this.style?.radius || 4,
        getFillColor: this.hexToRgbaArray(this.style?.fillColor),
        getLineColor: this.hexToRgbaArray(this.style?.lineColor),
        getLineWidth: this.style?.lineWidth || 5,
        lineWidthUnits: "pixels",
        pointRadiusUnits: "pixels",
        updateTriggers: {
          getPointRadius: this.style?.radius,
          getFillColor: this.style?.fillColor,
          getLineColor: this.style?.lineColor,
          getLineWidth: this.style?.lineWidth
        },
      });
      this.deck.setProps({ layers: [layer] });
    },
    renderLine() {
      const layer = new GeoJsonLayer({
        data: "./_line.geojson",
        stroked: true,
        filled: true,
        getLineColor: this.hexToRgbaArray(this.style?.lineColor),
        getLineWidth: this.style?.lineWidth || 5,
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

        console.log(this.style?.fillPattern);
        
        layer = new GeoJsonLayer({
          data: "./_polygon.geojson",
          stroked: true,
          filled: true,
          getFillColor: this.hexToRgbaArray(this.style?.fillColor),
          getLineColor: this.hexToRgbaArray(this.style?.lineColor),
          getLineWidth: this.style?.lineWidth || 5,
          lineWidthUnits: "pixels",
          getDashArray: this.style?.dashArray?.split(",").map(Number) || [0, 0],
          dashJustified: true,
          dashGapPickable: true,
          getFillPatternEnabled: (f) => this.style?.fillPattern != "none",
          fillPatternAtlas: "./patterns/patterns.png",
          fillPatternMapping: "./patterns/patterns.json",
          fillPatternMask: true,
          getFillPattern: (f) => this.style?.fillPattern,
          getFillPatternScale: (f) => this.style?.fillPatternScale || 5,
          getFillPatternOffset: (f) =>
            this.style?.fillPatternOffset.split(",").map(Number) || [0, 0],
          extensions: [
            new PathStyleExtension({ dash: true }),
            new FillStyleExtension({ pattern: true }),
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
          data: "./_polygon.geojson",
          stroked: true,
          filled: true,
          getFillColor: this.hexToRgbaArray(this.style?.fillColor),
          getLineColor: this.hexToRgbaArray(this.style?.lineColor),
          getLineWidth: this.style?.lineWidth || 5,
          lineWidthUnits: "pixels",
          getDashArray: this.style?.dashArray?.split(",").map(Number) || [0, 0],
          dashJustified: true,
          dashGapPickable: true,
          extensions: [
            new PathStyleExtension({ dash: true })
          ],
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
