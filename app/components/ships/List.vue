<template>
  <v-navigation-drawer v-model="dialogOpened" :location="$vuetify.display.mobile ? 'bottom' : undefined" style="z-index: 1001" permanent :width="$vuetify.display.mobile ? '100%' : '400'" v-if="dialogOpened">
    <v-toolbar class="fixed-bar" color="white" dark style="border-bottom: 1px solid #ccc">
      <v-toolbar-title class="text-h5 font-weight-black pl-4"> Ships </v-toolbar-title>

      <v-spacer></v-spacer>
      <v-btn icon @click="dialogOpened = false" density="compact">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>

    <!-- Search input field -->
    <v-text-field v-model="search" outlined clearable placeholder="Search ships by name or MMSI" hide-details></v-text-field>

    <v-data-table-server class="ships" density="compact" :items-per-page="itemsPerPage" :headers="headers" :items="serverItems" :items-length="totalItems" :loading="loading" :search="search" item-value="_id" @update:options="loadItems">
      <template v-slot:item.mmsi="{ item }">
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
          key: "mmsi",
        },
      ],
      serverItems: [],
      loading: true,
      totalItems: 0,
      search: "",
    }),

    computed: {
      // Getter and setter for dialog opened state
      dialogOpened: {
        get() {
          return this.$store.state.ships.listOpened;
        },
        set(value) {
          this.$store.state.ships.listOpened = value;
        },
      },
    },

    methods: {
      // Load items from server
      loadItems({ page, itemsPerPage }) {
        this.loading = true;

        this.$store
          .dispatch("ships/SEARCH", { page, itemsPerPage, searchText: this.search })
          .then(({ items, total }) => {
            this.serverItems = items.map((ship) => {
              ship.flag = "svgo-" + (ship?.countrycode || "xx").toLowerCase();
              return ship;
            });
            this.totalItems = total;
            this.loading = false;
          })
          .catch(() => {
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
        this.$store.dispatch("ships/SET_SELECTED", ship);
      },
    },
  };
</script>
<style>
  .flag {
    width: 25px;
    height: 25px;
  }

  .ships .v-data-table__thead,
  .ships .v-data-table-footer__items-per-page {
    display: none !important;
  }

  .ships .v-table__wrapper {
    height: calc(100vh - 305px) !important;
  }

  .ships .v-data-table__tr td {
    padding: 0px !important;
  }
</style>
