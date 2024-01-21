<template>
  <v-virtual-scroll :items="shipsList" height="100%" item-height="49">
    <!-- Render each ship item -->
    <template v-slot:default="{ item }">
      <v-list-item
        :title="item.ship_name || 'N/A'"
        :subtitle="item.mmsi || 'N/A'"
      >
        <template v-slot:prepend>
          <v-avatar size="30">
            <!-- Check if country code exists before trying to load the image -->
            <v-img
              v-if="item?.country?.code"
              :src="`https://hatscripts.github.io/circle-flags/flags/${item.country.code.toLowerCase()}.svg`"
              @error="handleImageError"
            ></v-img>
            <!-- Show a default image if country code does not exist -->
            <v-img
              v-else
              src="https://hatscripts.github.io/circle-flags/flags/xx.svg"
            ></v-img>
          </v-avatar>
        </template>
        <v-divider></v-divider>
      </v-list-item>
    </template>
  </v-virtual-scroll>
</template>

<script>
import { io } from "socket.io-client";
import { shipsStore } from "~/stores/shipsStore";

export default {
  data() {
    return {
      connected: false,
      socket: null,
      shipSelected: null,
      messageBuffer: [],
      bufferInterval: null,
    };
  },

  setup() {
    const ships = shipsStore();
    return { ships };
  },

  beforeDestroy() {
    clearInterval(this.bufferInterval);
  },

  mounted() {
    this.ships.fetchShips().then(() => {
      this.socket = io(this.$config.REALTIME_URL);
      this.log("Socket init");

      this.socket.on("connect", this.onSocketConnect);
      this.socket.on("disconnect", this.onSocketDisconnect);
      this.bufferInterval = setInterval(this.processMessageBatch, 5000);
    });
  },

  computed: {
    shipsList() {
      return [...this.ships?.list?.values()];
    },
  },

  methods: {
    handleImageError(e) {
      // Handle image loading errors
      e.target.src = "https://hatscripts.github.io/circle-flags/flags/xx.svg";
    },
    onSocketConnect() {
       // Log when the socket is connected and set up message event handler
      this.log("Socket connected");
      this.socket.on("message", this.onSocketMessage);
    },

    onSocketDisconnect() {
      // Log when the socket is disconnected and remove message event handler
      this.log("Socket disconnected");
      this.socket.off("message");
    },

    onSocketMessage(...args) {
      // Add received message to the buffer for later processing
      this.messageBuffer.push(args[0]);
    },

    processMessageBatch() {
      // Process each message in the buffer and update ships data
      this.messageBuffer.forEach((msg) => {
        this.ships.createOrReplace(msg);
      });
      this.messageBuffer = [];
    },

    log(message) {
      // Log a formatted message with timestamp
      console.info(`[${new Date()}] ${message}`);
    },
  },
};
</script>
