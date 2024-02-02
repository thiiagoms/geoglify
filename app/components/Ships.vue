<template>
  <v-toolbar
    dark
    class="fixed-bar"
    v-if="shipsStoreInstance.isNavigationDrawerOpen"
  >
    <v-toolbar-title class="font-weight-black">
      SHIPS ({{ filteredShips.length }} /
      {{ shipsStoreInstance.shipList.size }})
    </v-toolbar-title>
    <v-btn icon @click="shipsStoreInstance.setNavigationDrawerState(false)">
      <v-icon>mdi-close</v-icon>
    </v-btn>
  </v-toolbar>

  <div>
    <!-- Search input field -->
    <v-text-field
      v-model="shipsStoreInstance.searchText"
      outlined
      clearable
      placeholder="Search ships by name or MMSI"
      hide-details
    ></v-text-field>

    <!-- Virtual scroll for ships list -->
    <v-virtual-scroll
      :items="filteredShips"
      item-height="49"
      style="height: calc(100vh - 195px)"
    >
      <template v-slot:default="{ item }">
        <!-- List item for each ship -->
        <v-list-item class="ship-item" @click="selectShip(item)">
          <!-- Ship name -->
          <v-list-item-title class="font-weight-bold">{{
            item.name || "N/A"
          }}</v-list-item-title>

          <!-- Ship details: MMSI, Cargo, Updated At -->
          <v-list-item-subtitle class="text-caption">
            <p><b>MMSI:</b> {{ item.mmsi || "N/A" }}</p>
            <p><b>CARGO:</b> {{ item.cargo || "N/A" }}</p>
            <p><b>UPDATED AT:</b> {{ formatDate(item.time_utc) || "N/A" }}</p>
          </v-list-item-subtitle>

          <!-- Flag image in the prepend slot -->
          <template v-slot:prepend>
            <v-avatar size="30">
              <v-img
                v-if="item?.country_code"
                :src="`https://hatscripts.github.io/circle-flags/flags/${item.country_code.toLowerCase()}.svg`"
                @error="handleImageError"
              ></v-img>
              <v-img
                v-else
                src="https://hatscripts.github.io/circle-flags/flags/xx.svg"
              ></v-img>
            </v-avatar>
          </template>
        </v-list-item>
      </template>
    </v-virtual-scroll>
  </div>
</template>

<script>
import { shipsStore } from "~/stores/shipsStore";

export default {
  setup() {
    const shipsStoreInstance = shipsStore();
    const filteredShips = shipsStoreInstance.filteredShipsList;
    return { shipsStoreInstance, filteredShips };
  },

  computed: {
    filteredShips() {
      return [...this.shipsStoreInstance.filteredList.values()];
    },
  },

  methods: {
    // Handle image loading errors
    handleImageError(e) {
      e.target.src = "https://hatscripts.github.io/circle-flags/flags/xx.svg";
    },

    // Helper method to format date
    formatDate(date) {
      return date
        ? new Date(date).toLocaleString("en-GB", { timeZone: "UTC" })
        : "";
    },

    // Select a ship and view details
    selectShip(ship) {
      this.shipsStoreInstance.setSelectedShip(ship);
    },
  },
};
</script>

<style scoped>
.ship-item {
  border-bottom: 1px solid #e0e0e0;
}
</style>
