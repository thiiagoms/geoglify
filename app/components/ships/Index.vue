<template>
  <v-btn class="position-absolute font-weight-bold text-body-2 text--uppercase" style="top: 10px; left: 10px; z-index: 1000" size="small" :prepend-icon="serviceStatusIcon" @click="dialogOpened = true">
    <template v-slot:prepend>
      <v-icon :color="serviceStatusColor"></v-icon>
    </template>
    {{ serviceStatusText }}
  </v-btn>
</template>

<script>
  import { io } from "socket.io-client";
  import { IconLayer, TextLayer, GeoJsonLayer, ScatterplotLayer } from "@deck.gl/layers";
  import { CollisionFilterExtension } from "@deck.gl/extensions";
  import { MapboxOverlay } from "@deck.gl/mapbox";

  const ZOOM_AIS_THRESHOLD = 14;

  export default {
    props: ["map"],

    data() {
      return {
        socket: null,
        serviceStatus: "connecting",
        messageBuffer: [],
        bufferInterval: null,
        aisLayer: null,
        antennaLayer: null,
        legendLayer: null,
        aisGeoJSONLayer: null,
        overlay: new MapboxOverlay({
          layers: [],
          layerFilter: (filter) => {
            // Set up a zoom listener to re-render the layers when the zoom crosses the AIS threshold
            const layer = filter.layer;

            const zoom = filter.viewport.zoom;

            if (layer.id === "ais-layer") return zoom <= ZOOM_AIS_THRESHOLD;
            else if (layer.id === "antenna-layer") return zoom > ZOOM_AIS_THRESHOLD;
            else if (layer.id === "aislegend-layer") return zoom > ZOOM_AIS_THRESHOLD;
            else if (layer.id === "aisgeojson-layer") return zoom > ZOOM_AIS_THRESHOLD;
            else return true;
          },
        }),
        lastestZoom: 0,
        ships: [],
      };
    },

    beforeDestroy() {
      clearInterval(this.bufferInterval);
    },

    computed: {
      dialogOpened: {
        get() {
          return this.$store.state.ships.listOpened;
        },
        set(value) {
          this.$store.state.ships.listOpened = value;
        },
      },

      filteredShips() {
        return this.$store.state.ships.list;
      },

      filteredShipsGeoJSON() {
        return this.filteredShips.map((v) => v.geojson);
      },

      selected() {
        return this.$store.state.ships.selected;
      },

      serviceStatusIcon() {
        switch (this.serviceStatus) {
          case "offline":
            return "mdi-wifi-off";
          case "online":
            return "mdi-wifi";
          case "warning":
            return "mdi-wifi-strength-alert-outline";
          case "connecting":
            return "mdi-wifi-strength-1";
        }
      },
      serviceStatusColor() {
        switch (this.serviceStatus) {
          case "offline":
            return "red";
          case "online":
            return "green";
          case "warning":
            return "orange";
          case "connecting":
            return "blue";
        }
      },
      serviceStatusText() {
        switch (this.serviceStatus) {
          case "offline":
            return "Offline";
          case "online":
            return this.filteredShips.length + " ships";
          case "warning":
            return "Warning";
          case "connecting":
            return "Connecting";
        }
      },
    },

    methods: {
      onSocketConnect() {
        // Log when the socket is connected and set up the message event handler
        this.log("Socket connected");
        this.serviceStatus = "online";
        this.socket.on("message", this.onSocketMessage);
      },

      onSocketDisconnect() {
        // Log when the socket is disconnected and remove the message event handler
        this.log("Socket disconnected");
        this.serviceStatus = "offline";
        this.socket.off("message");
      },

      onSocketConnectError() {
        // Log when the socket connection fails
        this.log("Socket connection error");
        this.serviceStatus = "warning";
        if (!this.socket.active) {
          this.serviceStatus = "warning";
          this.socket.connect();
        }
      },

      onSocketMessage(...args) {
        // Add the received message to the buffer for later processing
        this.messageBuffer.push(args[0]);
      },

      async processMessageBatch() {
        // Process each message in the buffer and update ships data
        if (this.messageBuffer.length > 0) {
          this.$store.dispatch("ships/CREATE_OR_REPLACE", this.messageBuffer);
          this.render();
          this.messageBuffer = [];
        }
      },

      log(message) {
        // Log a formatted message with a timestamp
        console.info(`[${new Date()}] ${message}`);
      },

      render() {
        // create a new GeojsonLayer for the AIS data
        this.aisGeoJSONLayer = new GeoJsonLayer({
          id: "aisgeojson-layer",
          data: this.filteredShipsGeoJSON,
          pickable: true,
          filled: true,
          getFillColor: (f) => (f.properties._id == this.selected?._id ? [255, 234, 0, 255] : f.properties.color),
          lineJointRounded: true,
          lineCapRounded: true,
          autoHighlight: true,
          highlightColor: [255, 234, 0],
          onClick: ({ object }) => this.$store.dispatch("ships/SET_SELECTED", object.properties),
        });

        this.antennaLayer = new ScatterplotLayer({
          id: "antenna-layer",
          data: this.filteredShips,
          pickable: false,
          opacity: 0.8,
          stroked: true,
          filled: false,
          lineWidthMinPixels: 4,
          getPosition: (f) => f.location.coordinates,
          sizeUnits: "meters",
          getRadius: (d) => 1,
          getLineColor: (d) => [255, 255, 255],
        });

        // Create a new TextLayer for the ship names
        this.legendLayer = new TextLayer({
          id: "aislegend-layer",
          data: this.filteredShips,
          pickable: false,
          fontFamily: "Nunito",
          getPosition: (f) => f.location.coordinates,
          getText: (f) => (!!f.shipname ? f.shipname.trim() : "N/A"),
          getColor: [255, 255, 255, 255],
          getSize: 12,
          getTextAnchor: "start",
          getPixelOffset: [15, 0],
          getAngle: (f) => 0,
          fontWeight: "bold",
        });

        // Create a new IconLayer for the AIS data
        this.aisLayer = new IconLayer({
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
          getColor: (f) => (f._id == this.selected?._id ? [255, 234, 0, 255] : f.color),
          getCollisionPriority: (f) => f.priority,
          extensions: [new CollisionFilterExtension()],
          collisionGroup: "visualization",
          pickable: true,
          onClick: ({ object }) => this.$store.dispatch("ships/SET_SELECTED", object),
        });

        this.overlay.setProps({
          layers: [this.aisLayer, this.aisGeoJSONLayer, this.antennaLayer, this.legendLayer],
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
      this.map.addControl(this.overlay);

      // Fetch the ships data and draw the layers
      await this.$store.dispatch("ships/FETCH");

      // Set up the socket connection
      this.socket = io(this.$config.public.REALTIME_URL);
      this.socket.on("connect", this.onSocketConnect);
      this.socket.on("disconnect", this.onSocketDisconnect);
      this.socket.on("connect_error", this.onSocketDisconnect);

      // Render the layers
      this.render();

      // Set up a buffer interval to process messages every 5 seconds
      this.bufferInterval = setInterval(this.processMessageBatch, 5000);
    },
  };
</script>
