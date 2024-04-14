<template>
  <v-toolbar
    class="fixed-bar"
    color="white"
    dark
    style="border-bottom: 1px solid #ccc"
    v-if="shipsStoreInstance.isNavigationDrawerOpen"
  >
    <v-toolbar-title>
      <v-list-item class="px-3">
        <v-list-item-title class="text-h6 font-weight-black"
          >Ships</v-list-item-title
        >
        <v-list-item-subtitle class="text-caption"
          >({{ filteredShips.length }} /
          {{ shipsStoreInstance.shipList.length }})</v-list-item-subtitle
        >
      </v-list-item>
    </v-toolbar-title>

    <v-spacer></v-spacer>
    <v-btn
      icon
      @click="shipsStoreInstance.setNavigationDrawerState(false)"
      density="compact"
    >
      <v-icon>mdi-close</v-icon>
    </v-btn>
  </v-toolbar>

  <div>
    <!-- Search input field -->
    <v-text-field
      v-model="search"
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
            item?.geojson?.properties?.shipname ||
            item?.geojson?.properties?.mmsi ||
            "N/A"
          }}</v-list-item-title>

          <!-- Ship details: IMO, MMSI, Flag, Call Sign, Updated At, Flag Country Name, Ship Type Description -->
          <v-list-item-subtitle class="text-caption">
            <p>{{ formatDate(item?.geojson?.properties?.utc) || "N/A" }}</p>
          </v-list-item-subtitle>

          <!-- Flag image in the prepend slot -->
          <template v-slot:prepend>
            <v-avatar size="30">
              <v-img
                :src="`https://hatscripts.github.io/circle-flags/flags/${(
                  item?.countrycode || 'xx'
                ).toLowerCase()}.svg`"
              ></v-img>
            </v-avatar>
          </template>
        </v-list-item>
      </template>
    </v-virtual-scroll>
  </div>
</template>

<script>
export default {
  setup() {
    function createDebounce() {
      let timeout = null;
      return function (fnc, delayMs) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          fnc();
        }, delayMs || 500);
      };
    }

    const shipsStoreInstance = shipsStore();
    return { shipsStoreInstance, debounce: createDebounce() };
  },

  computed: {
    filteredShips() {
      return this.shipsStoreInstance.filteredList;
    },
    search: {
      get() {
        return this.shipsStoreInstance.searchText;
      },
      set(value) {
        this.debounce(() => {
          this.shipsStoreInstance.searchText = value;
        }, 300);
      },
    },
  },

  methods: {
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
