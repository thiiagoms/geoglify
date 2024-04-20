<template>
  <v-navigation-drawer v-model="dialogOpened" :location="$vuetify.display.mobile ? 'bottom' : undefined" temporary :width="$vuetify.display.mobile ? '100%' : '350px'">
    <v-toolbar class="fixed-bar" color="white" dark style="border-bottom: 1px solid #ccc" v-if="shipsStoreInstance.isNavigationDrawerOpen">
      <v-toolbar-title>
        <v-list-item class="px-3">
          <v-list-item-title class="text-h6 font-weight-black">Ships</v-list-item-title>
          <v-list-item-subtitle class="text-caption">({{ itemsPerPage }} / {{ this.totalItems }})</v-list-item-subtitle>
        </v-list-item>
      </v-toolbar-title>

      <v-spacer></v-spacer>
      <v-btn icon @click="shipsStoreInstance.setNavigationDrawerState(false)" density="compact">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>

    <div>
      <!-- Search input field -->
      <v-text-field v-model="search" outlined clearable placeholder="Search ships by name or MMSI" hide-details></v-text-field>

      <v-data-table-server density="compact" :items-per-page="itemsPerPage" :headers="headers" :items="serverItems" :items-length="totalItems" :loading="loading" :search="search" item-value="_id" @update:options="loadItems">
        <template v-slot:item.shipname="{ item }">
          <v-list-item @click="selectShip(item)">
            <v-list-item-title class="font-weight-bold">{{ item?.shipname || item?.mmsi || "N/A" }}</v-list-item-title>

            <v-list-item-subtitle class="text-caption">
              <p>{{ formatDate(item?.utc) || "N/A" }}</p>
            </v-list-item-subtitle>

            <template v-slot:prepend>
              <v-avatar size="30">
                <component :is="item.flag" filled class="flag"></component>
              </v-avatar>
            </template>
          </v-list-item>
        </template>
      </v-data-table-server>
    </div>
  </v-navigation-drawer>
</template>

<script>
  export default {
    props: ["map"],

    data: () => ({
      itemsPerPage: 20,
      headers: [
        {
          title: "Ship",
          align: "start",
          sortable: false,
          key: "shipname",
        },
      ],
      serverItems: [],
      loading: true,
      totalItems: 0,
    }),

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
      dialogOpened: {
        get() {
          return this.shipsStoreInstance.isNavigationDrawerOpen;
        },
        set(value) {
          this.shipsStoreInstance.setNavigationDrawerState(value);
        },
      },
    },

    methods: {
      loadItems({ page, itemsPerPage }) {
        this.loading = true;

        this.shipsStoreInstance
          .searchShips({ page, itemsPerPage })
          .then(({ items, total }) => {
            this.serverItems = items.map((ship) => {
              ship.flag = "svgo-" + (ship?.countrycode || "xx").toLowerCase();
              return ship;
            });
            this.totalItems = total;
            this.loading = false;
          })
          .catch((error) => {
            this.serverItems = [];
            this.totalItems = 0;
            this.loading = false;
          });
      },

      // Helper method to format date
      formatDate(date) {
        return date ? new Date(date).toLocaleString("en-GB", { timeZone: "UTC" }) : "";
      },

      // Select a ship and view details
      selectShip(ship) {
        // Fly to the selected ship
        this.map.flyTo({
          center: ship.location.coordinates,
          zoom: 16,
          essential: true,
        });

        // Set the selected ship
        this.shipsStoreInstance.setSelectedShip(ship);
      },
    },
  };
</script>
<style>
  .flag {
    width: 25px;
    height: 25px;
  }

  .v-data-table__thead,
  .v-data-table-footer__items-per-page {
    display: none !important;
  }

  .v-table__wrapper {
    height: calc(100vh - 305px) !important;
  }

  .v-data-table__tr td {
    padding: 0px !important;
  }
</style>
