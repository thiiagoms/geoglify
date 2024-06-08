<template>
  <v-btn class="position-absolute font-weight-bold text-body-2 text--uppercase" style="top: 10px; right: 45px; z-index: 1000" rounded="md" size="small" @click="toggleMapMode" :color="mapMode === '3D' ? 'green' : 'white'">
    <v-icon>mdi-cube-outline</v-icon>
    3D
  </v-btn>

  <v-btn class="position-absolute font-weight-bold text-body-2 text--uppercase" style="top: 10px; left: 45px; z-index: 1000" rounded="md" size="small" :prepend-icon="serviceStatusIcon" @click="dialogOpened = true">
    <template v-slot:prepend>
      <v-icon :color="serviceStatusColor"></v-icon>
    </template>
    {{ serviceStatusText }}
  </v-btn>
</template>

<script>
  import { io } from "socket.io-client";
  import { IconLayer, TextLayer, GeoJsonLayer } from "@deck.gl/layers";
  import { CollisionFilterExtension, PathStyleExtension } from "@deck.gl/extensions";
  import { MapboxOverlay } from "@deck.gl/mapbox";

  const ZOOM_AIS_THRESHOLD = 14;

  export default {
    props: ["map", "tooltip"],

    data() {
      return {
        mapMode: "2D",
        socket: null,
        serviceStatus: "connecting",
        messageBuffer: [],
        bufferInterval: null,
        aisLayer: null,
        legendLayer: null,
        aisGeoJSONLayer: null,
        pathLayer: null,
        checkPointPathLayer: null,
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
        if (!this.lastIntervalTimestamp || now - this.lastIntervalTimestamp > 1000) {
          // Process the message buffer every second
          this.processMessageBatch();

          // Update the timestamp to right now
          this.lastIntervalTimestamp = now;

          let visibleFeatures = [];

          if (this.map.getZoom() > ZOOM_AIS_THRESHOLD) {
            // Get the visible features from the overlay
            visibleFeatures = this.getVisibleShips();
          }

          if (this.map.getZoom() > ZOOM_AIS_THRESHOLD) {
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
              getLineColor: [255, 255, 255, 255],
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
          } else {
            this.aisGeoJSONLayer = null;
          }

          if (this.map.getZoom() > ZOOM_AIS_THRESHOLD + 3) {
            // Create a new TextLayer for the ship names
            this.legendLayer = new TextLayer({
              id: "aislegend-layer",
              data: visibleFeatures,
              fontFamily: "Monaco, monospace",
              fontSettings: {
                sdf: true,
                fontSize: 128,
                buffer: 64,
                radius: 64,
              },
              fontWeight: "bold",
              //fip text to the right angle to legible angle for the user
              getAngle: (f) => (f.hdg == 511 || f.hdg === undefined ? 0 : f.hdg > 180 ? 270 - f.hdg : 90 - f.hdg),
              billboard: false,
              getBackgroundColor: [255, 255, 255],
              getColor: [0, 0, 0],
              outlineColor: [255, 255, 255],
              outlineWidth: 30,
              getPosition: (f) => f.center.coordinates,
              getSize: (f) => 14,
              getText: (f) => (!!f.shipname ? f.shipname : "N/A"),
              getTextAnchor: "middle",
              extensions: [new CollisionFilterExtension()],
              collisionGroup: "aislegend-layer",
            });
          } else {
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
            getSize: (f) => f.size,
            getColor: (f) => (f._id == this.selected?._id ? [255, 234, 0, 255] : f.color),
            getCollisionPriority: (f) => f.priority,
            extensions: [new CollisionFilterExtension()],
            collisionGroup: "ais-layer",
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

          // Get the GeoJSON data for the selected ship
          let pathGeoJSON = this.selected?.path;

          // Check if the GeoJSON data is valid
          if (!!pathGeoJSON) {
            // Filter the GeoJSON data to include only points and line strings
            const pointsOnly = this.filterPoints(pathGeoJSON);

            // Filter the GeoJSON data to include only line strings
            const lineStringsOnly = this.filterLineStrings(pathGeoJSON);

            // Create a new GeoJsonLayer for the line strings
            this.pathLayer = new GeoJsonLayer({
              id: "path-layer",
              data: lineStringsOnly,
              getLineColor: [255, 234, 0, 255],
              getDashArray: [3, 2],
              lineWidthMinPixels: 2,
              dashJustified: true,
              dashGapPickable: true,
              extensions: [new PathStyleExtension({ dash: true })],
            });

            // Create a new GeoJsonLayer for the points
            this.checkPointPathLayer = new TextLayer({
              id: "checkpoint-path-layer",
              data: pointsOnly.features,
              fontFamily: "Monaco, monospace",
              fontSettings: {
                sdf: true,
                fontSize: 128,
                buffer: 64,
                radius: 64,
              },
              fontWeight: "bold",
              getBackgroundColor: [255, 234, 0, 255],
              getColor: [0, 0, 0],
              outlineColor: [255, 255, 255],
              outlineWidth: 30,
              getPosition: (f) => f.geometry.coordinates,
              getSize: (f) => 12,
              getText: (f) => f.properties.sog + " knots" + "\n" + this.formatDate(f.properties.updated_at),
              extensions: [new CollisionFilterExtension()],
              collisionGroup: "visualization",
            });
          } else {
            // Clear the layers if the GeoJSON data is invalid
            this.checkPointPathLayer = null;
            this.pathLayer = null;
          }

          // Update the layers in the overlay
          this.overlay.setProps({
            layers: [this.pathLayer, this.checkPointPathLayer, this.aisLayer, this.aisGeoJSONLayer, this.legendLayer, this.ships3D].filter(Boolean),
          });
        }

        requestAnimationFrame(this.render.bind(this));
      },

      // Get the visible features from the overlay
      getVisibleShips() {
        let data = this.overlay
          .pickMultipleObjects({
            x: this.overlay._deck.width / 2,
            y: this.overlay._deck.height / 2,
            radius: Math.max(this.overlay._deck.width, this.overlay._deck.height) / 2,
            depth: 100,
            layerIds: ["ais-layer"],
            unproject3D: false,
          })
          .map((f) => f.object);

        return JSON.parse(JSON.stringify(data));
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

      filterPoints(featureCollection) {
        // Check if the input is a valid GeoJSON FeatureCollection
        if (!featureCollection || featureCollection.type !== "FeatureCollection" || !Array.isArray(featureCollection.features)) {
          throw new Error("Invalid GeoJSON FeatureCollection");
        }

        // Filter the features to include only those with geometry type "Point"
        const filteredFeatures = featureCollection.features.filter((feature) => {
          return feature.geometry && feature.geometry.type === "Point";
        });

        // Return a new FeatureCollection with the filtered features
        return {
          type: "FeatureCollection",
          features: filteredFeatures,
        };
      },

      filterLineStrings(featureCollection) {
        // Check if the input is a valid GeoJSON FeatureCollection
        if (!featureCollection || featureCollection.type !== "FeatureCollection" || !Array.isArray(featureCollection.features)) {
          throw new Error("Invalid GeoJSON FeatureCollection");
        }

        // Filter the features to include only those with geometry type "LineString"
        const filteredFeatures = featureCollection.features.filter((feature) => {
          return feature.geometry && feature.geometry.type === "LineString";
        });

        // Return a new FeatureCollection with the filtered features
        return {
          type: "FeatureCollection",
          features: filteredFeatures,
        };
      },

      toggleMapMode() {
        this.mapMode = this.mapMode === "2D" ? "3D" : "2D";
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
  };
</script>
