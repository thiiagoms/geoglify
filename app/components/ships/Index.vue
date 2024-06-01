<template>
  <v-btn class="position-absolute font-weight-bold text-body-2 text--uppercase" style="top: 10px; left: 45px; z-index: 1000" rounded="lg" size="small" :prepend-icon="serviceStatusIcon" @click="dialogOpened = true">
    <template v-slot:prepend>
      <v-icon :color="serviceStatusColor"></v-icon>
    </template>
    {{ serviceStatusText }}
  </v-btn>
</template>

<script>
  import { io } from "socket.io-client";
  import { IconLayer, TextLayer, GeoJsonLayer, PathLayer } from "@deck.gl/layers";
  import { CollisionFilterExtension, PathStyleExtension } from "@deck.gl/extensions";
  import { MapboxOverlay } from "@deck.gl/mapbox";

  const ZOOM_AIS_THRESHOLD = 14;

  export default {
    props: ["map", "tooltip"],

    data() {
      return {
        socket: null,
        serviceStatus: "connecting",
        messageBuffer: [],
        bufferInterval: null,
        aisLayer: null,
        legendLayer: null,
        aisGeoJSONLayer: null,
        pathLayer: null,
        pathLayerOffset: null,
        overlay: new MapboxOverlay({
          interleaved: false,
          layers: [],
          layerFilter: (filter) => {
            // Set up a zoom listener to re-render the layers when the zoom crosses the AIS threshold
            if (filter.layer.id === "aislegend-layer") return filter.viewport.zoom > ZOOM_AIS_THRESHOLD;
            if (filter.layer.id === "aisgeojson-layer") return filter.viewport.zoom > ZOOM_AIS_THRESHOLD;
            return true;
          },
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
          return this.$store.state.ships.listOpened;
        },
        set(value) {
          this.$store.state.ships.listOpened = value;
        },
      },

      filteredShips() {
        return this.$store.state.ships.list.filter((s) => s.location && s.location.coordinates && this.$store.state.ships.cargos.some((c) => c.code === (s.cargo ?? 0) && c.is_active));
      },

      selected() {
        return this.$store.state.ships.selected;
      },

      selectedPath() {
        return this.$store.state.ships.selectedPath;
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

      tooltipInfo: {
        get() {
          return this.tooltip;
        },
        set(value) {
          this.$emit("update:tooltip", value);
        },
      },
    },

    methods: {
      onSocketConnect() {
        // Log when the socket is connected and set up the message event handler
        this.log("Socket connected");
        this.serviceStatus = "online";
        this.socket.on("message", this.onSocketMessage);
        this.socket.on("messagesChunk", this.onSocketMessagesChunk);
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

      onSocketMessagesChunk(...args) {
        // Add the received messages to the buffer for later processing
        this.messageBuffer = this.messageBuffer.concat(args[0]);
      },

      async processMessageBatch() {
        // Process each message in the buffer and update ships data
        if (this.messageBuffer.length > 0) {
          let ships = JSON.parse(JSON.stringify(this.messageBuffer));
          this.$store.dispatch("ships/CREATE_OR_REPLACE", ships);
          this.messageBuffer = [];
        }
      },

      log(message) {
        // Log a formatted message with a timestamp
        console.info(`[${new Date()}] ${message}`);
      },

      render(now) {
        // Process the message buffer every second
        if (!this.lastIntervalTimestamp || now - this.lastIntervalTimestamp >= 1 * 1000) {
          // Process the message buffer every second
          this.processMessageBatch();

          // Update the timestamp to right now
          this.lastIntervalTimestamp = now;

          if (this.map.getZoom() > ZOOM_AIS_THRESHOLD) {
            // Get the visible features from the overlay
            let visibleFeatures = this.getVisibleShips();

            // Create a new GeoJsonLayer for the AIS data
            this.aisGeoJSONLayer = new GeoJsonLayer({
              id: "aisgeojson-layer",
              data: visibleFeatures.map((s) => s.geojson),
              pickable: true,
              filled: true,
              getFillColor: (f) => (f.properties._id == this.selected?._id ? [255, 234, 0, 255] : f.properties.colorGeoJson),
              lineJointRounded: true,
              lineCapRounded: true,
              autoHighlight: true,
              getLineWidth: 0.5,
              lineWidthMinPixels: 2,
              getLineColor: [128, 128, 128, 255],
              highlightColor: [255, 234, 0, 125],
              onClick: ({ object }) => {
                // Fly to the selected ship
                this.$store.dispatch("ships/SET_SELECTED", object.properties);

                // Unset the selected feature
                this.$store.dispatch("features/SET_SELECTED", null);

                return true;
              },

              onHover: (info) => this.showTooltip(info),
            });

            // Create a new TextLayer for the ship names
            this.legendLayer = new TextLayer({
              id: "aislegend-layer",
              data: visibleFeatures,

              fontFamily: "Monaco, monospace",
              fontSettings: {
                sdf: true,
                fontSize: 128,
                buffer: 20,
                radius: 64,
              },
              fontWeight: "bold",
              getAngle: 0,
              getBackgroundColor: [255, 255, 255],
              getColor: [0, 0, 0],
              getPosition: (f) => f.location.coordinates,
              getSize: 16,
              getText: (f) => (!!f.shipname ? f.shipname.trim() : "N/A"),
              getTextAnchor: "middle",
              getColor: [0, 0, 0],
              outlineColor: [255, 255, 255],
              outlineWidth: 30,
              getTextAnchor: "start",
              getPixelOffset: [15, 0],
            });
          } else {
            // Clear the layers if the zoom is below the threshold
            this.aisGeoJSONLayer = null;
            this.legendLayer = null;
          }

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
            getSize: (f) => (this.map.getZoom() < ZOOM_AIS_THRESHOLD ? f.size : 5),
            getColor: (f) => (f._id == this.selected?._id ? [255, 234, 0, 255] : f.color),
            getCollisionPriority: (f) => f.priority,
            extensions: [new CollisionFilterExtension()],
            collisionGroup: "visualization",
            pickable: true,
            onClick: ({ object }) => {
              // Fly to the selected ship
              this.$store.dispatch("ships/SET_SELECTED", object);

              // Unset the selected feature
              this.$store.dispatch("features/SET_SELECTED", null);

              return true;
            },

            onHover: (info) => this.showTooltip(info),
          });

          // Update the layers in the overlay
          this.overlay.setProps({
            layers: [this.aisLayer, this.aisGeoJSONLayer, this.legendLayer, this.pathLayer, this.pathLayerOffset],
          });
        }

        requestAnimationFrame(this.render.bind(this));
      },

      // Get the visible features from the overlay
      getVisibleShips() {
        return this.overlay
          .pickObjects({
            x: 0,
            y: 0,
            width: this.overlay._deck.width,
            height: this.overlay._deck.height,
            layerIds: ["ais-layer"],
          })
          .map((f) => f.object);
      },

      isMobile() {
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          return true;
        } else {
          return false;
        }
      },

      showTooltip({ object, x, y }) {
        this.tooltipInfo.style.display = "none";
        if (object && !this.isMobile()) {
          this.tooltipInfo.style.display = "block";
          this.tooltipInfo.style.left = `${x}px`;
          this.tooltipInfo.style.top = `${y}px`;

          this.tooltipInfo.innerHTML = "";

          let properties = object.properties || object;

          if (!!properties.mmsi) {
            let img = "https://photos.marinetraffic.com/ais/showphoto.aspx?mmsi=" + properties.mmsi;
            this.tooltipInfo.innerHTML += `<div><img src="${img}" style="width: 100%; height: 100px; object-fit: cover; object-position: center"></div>`;

            this.tooltipInfo.querySelector("img").onerror = () => {
              if (this.tooltipInfo && !!this.tooltipInfo.querySelector("img")) this.tooltipInfo.querySelector("img").src = "https://placehold.co/600x400?text=No+Photo";
            };
          }

          //name
          if (properties.shipname) {
            this.tooltipInfo.innerHTML += `<div><b>Ship Name</b>: ${properties.shipname}</div>`;
          }

          //mmsi
          if (properties.mmsi) {
            this.tooltipInfo.innerHTML += `<div><b>MMSI</b>: ${properties.mmsi}</div>`;
          }

          //utc
          if (properties.utc) {
            this.tooltipInfo.innerHTML += `<div><b>UTC</b>: ${this.formatDate(properties.utc)}</div>`;
          }
        } else {
          this.tooltipInfo.style.display = "none";
        }
      },

      // Helper method to format date
      formatDate(date) {
        return date ? new Date(date).toLocaleString({ timeZone: "UTC" }) : "";
      },
    },

    async mounted() {
      // Add the overlay to the map
      this.map.addControl(this.overlay);

      // Fetch the ships data and draw the layers
      await this.$store.dispatch("ships/FETCH");

      // Set up the socket connection
      this.socket = io(this.$config.public.REALTIME_URL);
      this.socket.on("connect", this.onSocketConnect);
      this.socket.on("disconnect", this.onSocketDisconnect);
      this.socket.on("connect_error", this.onSocketDisconnect);

      // Render the layers
      window.requestAnimationFrame(this.render.bind(this));
    },

    watch: {
      selectedPath(path) {
        if (!!path) {
          console.log(path);
          this.pathLayer = new PathLayer({
            id: "dashed",
            data: [{ path }],
            coordinateOrigin: [0, 0],
            getPath: (d) => d.path,
            getWidth: 25,
            getColor: [255, 255, 0],

            // props added by PathStyleExtension
            getDashArray: [6, 3],
            dashJustified: false,
            

            extensions: [new PathStyleExtension({ highPrecisionDash: true })],
          });

          

          // Update the layers in the overlay
          this.overlay.setProps({
            layers: [this.aisLayer, this.aisGeoJSONLayer, this.legendLayer, this.pathLayer, this.pathLayerOffset],
          });
        } else {
          // Update the layers in the overlay
          this.overlay.setProps({
            layers: [this.aisLayer, this.aisGeoJSONLayer, this.legendLayer],
          });
        }
      },
    },
  };
</script>
