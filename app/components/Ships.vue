<template>
  <div>
    <v-text-field
      v-model="searchText"
      outlined
      clearable
      placeholder="Search ships by name or MMSI"
      hide-details
    ></v-text-field>

    <v-virtual-scroll :items="filteredShipsList" item-height="49" style="height: calc(100vh - 195px)">
      <template v-slot:default="{ item }">
        <v-list-item class="item">
          <v-list-item-title class="font-weight-bold">{{
            item.ship_name || "N/A"
          }}</v-list-item-title>

          <v-list-item-subtitle class="text-caption">
            <p><b>MMSI:</b> {{ item.mmsi || "N/A" }}</p>
            <p><b>CARGO:</b> {{ item.cargo_name || "N/A" }}</p>
            <p><b>ETA:</b>  {{ item.eta ? new Date(item.eta).toLocaleString("en-GB", { timeZone: "UTC" }) : "N/A" }}</p>
          </v-list-item-subtitle>

          <template v-slot:prepend>
            <v-avatar size="30">
              <v-img
                v-if="item?.country?.code"
                :src="`https://hatscripts.github.io/circle-flags/flags/${item.country.code.toLowerCase()}.svg`"
                @error="handleImageError"
              ></v-img>

              <v-img
                v-else
                src="https://hatscripts.github.io/circle-flags/flags/xx.svg"
              ></v-img>
            </v-avatar>
          </template>

          <template v-slot:append>
            <v-btn
              color="grey-lighten-1"
              icon="mdi-target-variant"
              variant="text"
              size="small"
            ></v-btn>
            <v-btn
              color="grey-lighten-1"
              icon="mdi-information-outline"
              variant="text"
              size="small"
              @click="ships.selected = item"
            ></v-btn>
          </template>

        </v-list-item>
      </template>
    </v-virtual-scroll>
  </div>
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
      searchText: "",
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
      this.socket = io(this.$config.public.REALTIME_URL);
      this.socket.on("connect", this.onSocketConnect);
      this.socket.on("disconnect", this.onSocketDisconnect);
      this.bufferInterval = setInterval(this.processMessageBatch, 5000);
    });
  },

  computed: {
    shipsList() {
      return [...this.ships?.list?.values()];
    },
    filteredShipsList() {
      if (!this.searchText) {
        return this.shipsList.slice(0, 100);
      }

      return this.shipsList
        .filter((item) => {
          return (
            (item.ship_name &&
              item.ship_name
                .toLowerCase()
                .includes(this.searchText.toLowerCase())) ||
            (item.mmsi &&
              item.mmsi
                .toString()
                .toLowerCase()
                .includes(this.searchText.toLowerCase()))
          );
        })
        .slice(0, 100);
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
<style scoped>
.item {
  border-bottom: 1px solid #e0e0e0;
}
</style>