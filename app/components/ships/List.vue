<template>
  <v-navigation-drawer v-model="dialogOpened" :location="$vuetify.display.mobile ? 'bottom' : undefined" style="z-index: 1001" permanent :width="$vuetify.display.mobile ? '100%' : '400'" v-if="dialogOpened">
    <v-toolbar class="fixed-bar" color="white" dark style="border-bottom: 1px solid #ccc">
      <v-toolbar-title class="text-h5 font-weight-black pl-4"> Ships </v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn icon @click="toggleGeofencerSearch" density="compact" :color="geofencerSearchEnabled ? 'primary' : 'default'">
        <v-icon>mdi-magnify-expand</v-icon>
      </v-btn>

      <v-btn icon @click="openFiltersDialog = true" density="compact">
        <v-badge color="red" dot v-if="this.cargosSelected.length != this.$store.state.ships.cargos.length">
          <v-icon>mdi-filter-outline</v-icon>
        </v-badge>
        <v-icon v-else>mdi-filter-outline</v-icon>
      </v-btn>

      <v-btn icon @click="dialogOpened = false" density="compact">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>

    <!-- Search input field -->
    <v-text-field v-model="search" outlined clearable placeholder="Search ships by name or MMSI" hide-details></v-text-field>

    <v-data-table-server class="ships" :items-per-page="itemsPerPage" :headers="headers" :items="serverItems" :items-length="totalItems" :loading="loading" :search="search" item-value="_id" @update:options="loadItems">
      <template v-slot:item.mmsi="{ item }">
        <v-card class="mt-1 mx-1 border" variant="outlined" density="comfortable" @click="selectShip(item)">
          <template v-slot:prepend>
            <v-avatar size="30">
              <component :is="item.flag" filled class="flag"></component>
            </v-avatar>
          </template>
          <template v-slot:title>
            <span class="font-weight-bold text-subtitle-1">{{ item?.shipname || item?.mmsi || "N/A" }}</span>
          </template>
          <template v-slot:subtitle>
            <p class="text-subtitle-2">{{ item?.cargo_name || "N/A" }}</p>
            <p class="text-subtitle-2">{{ formatDate(item?.utc) || "N/A" }}</p>
          </template>
          <template v-slot:append>
            <v-icon :color="item.cargo_color">mdi-label</v-icon>
          </template>
        </v-card>
      </template>
    </v-data-table-server>
  </v-navigation-drawer>

  <ShipsFilters :open="openFiltersDialog" @update:open="updateOpenFiltersDialogState"></ShipsFilters>

  <v-snackbar color="primary" elevation="24" v-model="geofencerSearchEnabled" location="bottom" location-strategy="connected" timeout="-1" style="position: absolute;">
    Draw a polygon on the map to search for ships within the area.<br />
    Area: {{ geofencerArea }} km<sup>2</sup>

    <template v-slot:actions>
      <v-btn variant="outlined" @click="searchByArea"> Search </v-btn>
    </template>
  </v-snackbar>
</template>

<script>
  import * as turf from "@turf/turf";
  import MapboxDraw from "@mapbox/mapbox-gl-draw";
  import configs from "~/helpers/configs";

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
      openFiltersDialog: false,
      geofencerSearchEnabled: false,
      geofencerDraw: null,
      geofencerFeatures: null,
      geofencerArea: 0,
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

      cargosSelected: {
        get() {
          return this.$store.state.ships.cargos.filter((cargo) => cargo.is_active).map((cargo) => cargo.code);
        },
      },
    },

    watch: {
      cargosSelected() {
        this.loadItems({ page: 1, itemsPerPage: 20 });
      },
    },

    methods: {
      // Load items from server
      loadItems({ page, itemsPerPage }) {
        this.loading = true;

        this.$store
          .dispatch("ships/SEARCH", {
            page: page,
            itemsPerPage: itemsPerPage,
            searchText: this.search,
            cargos: this.cargosSelected,
            geom: this.geofencerFeatures,
          })
          .then(({ items, total }) => {
            this.serverItems = items.map((ship) => {
              ship.flag = "svgo-" + (ship?.countrycode || "xx").toLowerCase();
              ship.cargo_name = configs.getCargoType(ship.cargo).name;
              ship.cargo_color = configs.getCargoType(ship.cargo).color;
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
        return date ? new Date(date).toLocaleString({ timeZone: "UTC" }) : "";
      },

      // Select a ship and view details
      selectShip(ship) {
        // Close the dialog of feature details
        this.$store.state.features.selected = null;

        // Fly to the selected ship
        this.map.flyTo({
          center: ship.location.coordinates,
          zoom: 16,
          essential: true,
        });

        // Set the selected ship
        this.$store.dispatch("ships/SET_SELECTED", ship);

        // Unset the selected feature
        this.$store.dispatch("features/SET_SELECTED", null);
      },

      updateOpenFiltersDialogState(value) {
        this.openFiltersDialog = value;
      },

      toggleGeofencerSearch() {
        // Toggle the geofencer search
        this.geofencerSearchEnabled = !this.geofencerSearchEnabled;

        // Initialize or remove the geofencer search
        if (this.geofencerSearchEnabled) {
          this.initGeofencerSearch();
        } else {
          this.removeGeofencerSearch();
        }
      },

      searchByArea() {
        // Get the geofencer features
        this.geofencerFeatures = this.geofencerDraw.getAll()["features"][0]["geometry"];

        // Load the items
        this.loadItems({ page: 1, itemsPerPage: 20 });
      },

      // Update the area of the geofencer search
      updateArea() {

        // geojson object of the drawn area
        let area = turf.area(this.geofencerDraw.getAll());

        // Calculate the area in km^2
        this.geofencerArea = Math.round(area / 1000000);
      },

      // Initialize the geofencer search
      initGeofencerSearch() {
        // Initialize the geofencer draw object
        this.geofencerDraw = new MapboxDraw({
          displayControlsDefault: false,
          styles: configs.getGeofencerStyle(),
        });

        // Add the geofencer draw control
        this.map.addControl(this.geofencerDraw);

        // Disable the draw and measures control (other controls are disabled when geofencer is enabled)
        document.querySelector(".draw_control").style.backgroundColor = "#ccc";
        document.querySelector(".measures_control").style.backgroundColor = "#ccc";

        document.querySelector(".draw_control").disabled = true;
        document.querySelector(".measures_control").disabled = true;

        // Change the mode to draw polygon
        this.geofencerDraw.changeMode("draw_polygon");

        // Add the event listeners
        this.map.on("draw.create", this.updateArea);
        this.map.on("draw.delete", this.updateArea);
        this.map.on("draw.update", this.updateArea);
      },

      // Remove the geofencer search
      removeGeofencerSearch() {
        // Remove the geofencer draw control
        if (this.geofencerDraw) this.map.removeControl(this.geofencerDraw);

        // Reset the draw control (other controls are disabled when geofencer is enabled)
        document.querySelector(".draw_control").style.backgroundColor = "white";
        document.querySelector(".measures_control").style.backgroundColor = "white";

        document.querySelector(".draw_control").disabled = false;
        document.querySelector(".measures_control").disabled = false;

        // Reset the geofencer draw object
        this.geofencerDraw = null;

        // Reset the geofencer features
        this.geofencerFeatures = null;

        // Reset the geofencer area
        this.geofencerArea = 0;

        // Remove event listeners
        this.map.off("draw.create", this.updateArea);
        this.map.off("draw.delete", this.updateArea);
        this.map.off("draw.update", this.updateArea);
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
    height: calc(100dvh - 260px) !important;
  }

  .ships .v-data-table__tr td {
    padding: 0px !important;
  }

  .ships .v-table__wrapper > table > tbody > tr:not(:last-child) > td,
  .ships .v-table__wrapper > table > tbody > tr:not(:last-child) > th {
    border-bottom: none !important;
  }
</style>
