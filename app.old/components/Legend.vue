<template>
  <div
    id="svgPreview"
    ref="svgPreview"
    style="position: relative; width: 100%; height: 100%"
  >
    <svg :style="{ width: '100%', height: '100%' }">
      <defs>
        <pattern
          :id="'legend-' + style.fillPattern"
          patternUnits="userSpaceOnUse"
          width="100"
          height="100"
        >
          <image
            :xlink:href="fillPatternUrl"
            x="0"
            y="0"
            width="100"
            height="100"
            :style="{
              filter: 'url(#legend-colorize)',
              opacity: 1,
              scale: 0.3
            }"
          />
        </pattern>
        <filter id="legend-colorize">
          <feColorMatrix
            color-interpolation-filters="sRGB"
            type="matrix"
            :values="colorMatrixValues(style.fillColor)"
          />
        </filter>
      </defs>
      <circle
        v-if="type === 'point'"
        :style="circleStyle"
        cx="50%"
        cy="50%"
        :r="Math.min(8, style.radius)"
      />
      <line
        v-else-if="type === 'line'"
        :style="lineStyle"
        x1="20%"
        y1="50%"
        x2="80%"
        y2="50%"
      />
      <rect
        v-else-if="type === 'polygon'"
        :style="rectStyle"
        x="8"
        y="8"
        width="15px"
        height="15px"
      />
    </svg>
  </div>
</template>

<script>
export default {
  props: {
    style: Object,
    type: String,
  },
  computed: {
    fillPatternUrl() {
      return "/patterns/" + this.style.fillPattern + ".png";
    },
    circleStyle() {
      return {
        fill: this.style.fillColor,
        stroke: this.style.lineColor,
        strokeWidth: Math.min(2, this.style.lineWidth) + "px",
        strokeDasharray: this.style.dashArray || "none",
      };
    },
    lineStyle() {
      return {
        stroke: this.style.lineColor,
        strokeWidth: this.style.lineWidth + "px",
        strokeDasharray: this.style.dashArray || "none",
      };
    },
    rectStyle() {
      if (this.style.fillPattern === "none") {
        return {
          fill: this.style.fillColor,
          stroke: this.style.lineColor,
          strokeWidth: Math.min(3, this.style.lineWidth) + "px",
          strokeDasharray: this.style.dashArray || "none",
        };
      } else {
        return {
          fill: 'url("#legend-' + this.style.fillPattern + '")',
          stroke: this.style.lineColor,
          strokeWidth: Math.min(3, this.style.lineWidth) + "px",
          strokeDasharray: this.style.dashArray || "none",
        };
      }
    },
  },
  methods: {
    colorMatrixValues(color) {
      // Convert hexadecimal color to RGB
      const hexToRgb = (hex) => {
        // Remove '#' if present
        hex = hex.replace("#", "");

        // Handle shorthand hex format
        if (hex.length === 3) {
          hex = hex
            .split("")
            .map((char) => char + char)
            .join("");
        }

        // Extract RGB components
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        return { r, g, b };
      };

      // Define color matrix values based on RGB
      const rgb = hexToRgb(color);
      const { r, g, b } = rgb;

      // Construct the color matrix
      const colorMatrix = `1 0 0 0 ${r / 255}
                      0 1 0 0 ${g / 255}
                      0 0 1 0 ${b / 255}
                      0 0 0 1 0`;

      // Return the color matrix values
      return colorMatrix;
    },
  },
};
</script>
