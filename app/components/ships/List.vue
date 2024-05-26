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

  <v-snackbar color="primary" elevation="24" v-model="geofencerSearchEnabled" location="bottom" location-strategy="connected" timeout="-1" style="position: absolute; bottom: 50px">
    Draw a polygon on the map to search for ships within the area.<br />And click search to find the ships in the area.

    <template v-slot:actions>
      <v-btn variant="outlined" @click="searchByArea"> Search </v-btn>
    </template>
  </v-snackbar>
</template>

<script>
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
        this.geofencerSearchEnabled = !this.geofencerSearchEnabled;
        this.geofencerDraw.changeMode("draw_polygon");
      },

      searchByArea() {
        this.geofencerFeatures = this.geofencerDraw.getAll()['features'][0]['geometry'];
        this.loadItems({ page: 1, itemsPerPage: 20 });
      },
    },

    mounted() {
      // Init geofencer drawer for search
      this.geofencerDraw = new MapboxDraw({
        displayControlsDefault: false,
        styles: [
          // ACTIVE (being drawn)
          // line stroke
          {
            id: "gl-draw-line",
            type: "line",
            filter: ["all", ["==", "$type", "LineString"], ["!=", "mode", "static"]],
            layout: {
              "line-cap": "round",
              "line-join": "round",
            },
            paint: {
              "line-color": "#1867c0",
              "line-dasharray": [0.2, 2],
              "line-width": 5,
            },
          },
          // polygon fill
          {
            id: "gl-draw-polygon-fill",
            type: "fill",
            filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
            paint: {
              "fill-color": "#1867c0",
              "fill-outline-color": "#1867c0",
              "fill-opacity": 0.1,
            },
          },
          // polygon mid points
          {
            id: "gl-draw-polygon-midpoint",
            type: "circle",
            filter: ["all", ["==", "$type", "Point"], ["==", "meta", "midpoint"]],
            paint: {
              "circle-radius": 5,
              "circle-color": "#1867c0",
              "circle-stroke-color": "#fff",
              "circle-stroke-width": 2,
            },
          },
          // polygon outline stroke
          // This doesn't style the first edge of the polygon, which uses the line stroke styling instead
          {
            id: "gl-draw-polygon-stroke-active",
            type: "line",
            filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
            layout: {
              "line-cap": "round",
              "line-join": "round",
            },
            paint: {
              "line-color": "#1867c0",
              "line-dasharray": [0.2, 2],
              "line-width": 5
            },
          },
          // vertex point halos
          {
            id: "gl-draw-polygon-and-line-vertex-halo-active",
            type: "circle",
            filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
            paint: {
              "circle-radius": 5,
              "circle-color": "#1867c0",
              "circle-stroke-color": "#fff",
              "circle-stroke-width": 2,
            },
          },
          // vertex points
          {
            id: "gl-draw-polygon-and-line-vertex-active",
            type: "circle",
            filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
            paint: {
              "circle-radius": 5,
              "circle-color": "#1867c0",
              "circle-stroke-color": "#fff",
              "circle-stroke-width": 2,
            },
          },

          // INACTIVE (static, already drawn)
          // line stroke
          {
            id: "gl-draw-line-static",
            type: "line",
            filter: ["all", ["==", "$type", "LineString"], ["==", "mode", "static"]],
            layout: {
              "line-cap": "round",
              "line-join": "round",
            },
            paint: {
              "line-color": "#1867c0",
              "line-width": 5,
            },
          },
          // polygon fill
          {
            id: "gl-draw-polygon-fill-static",
            type: "fill",
            filter: ["all", ["==", "$type", "Polygon"], ["==", "mode", "static"]],
            paint: {
              "fill-color": "#1867c0",
              "fill-outline-color": "#1867c0",
              "fill-opacity": 0.1,
            },
          },
          // polygon outline
          {
            id: "gl-draw-polygon-stroke-static",
            type: "line",
            filter: ["all", ["==", "$type", "Polygon"], ["==", "mode", "static"]],
            layout: {
              "line-cap": "round",
              "line-join": "round",
            },
            paint: {
              "line-color": "#1867c0",
              "line-width": 5,
            },
          },
        ],
      });

      this.map.addControl(this.geofencerDraw);
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
    height: calc(100dvh - 305px) !important;
  }

  .ships .v-data-table__tr td {
    padding: 0px !important;
  }

  .ships .v-table__wrapper > table > tbody > tr:not(:last-child) > td,
  .ships .v-table__wrapper > table > tbody > tr:not(:last-child) > th {
    border-bottom: none !important;
  }
</style>
