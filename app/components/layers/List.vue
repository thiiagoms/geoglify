<template>
  <v-navigation-drawer v-model="dialogOpened" :location="$vuetify.display.mobile ? 'bottom' : undefined" style="z-index: 2" permanent :width="$vuetify.display.mobile ? '100%' : '400'" v-if="dialogOpened">
    <v-toolbar class="fixed-bar" color="white" dark style="border-bottom: 1px solid #ccc">
      <v-toolbar-title class="text-h5 font-weight-black pl-4"> Layers </v-toolbar-title>

      <v-spacer></v-spacer>
      <v-btn icon @click="dialogOpened = false" density="compact">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>

    <!-- Search input field -->
    <v-text-field v-model="search" outlined clearable placeholder="Search layers" hide-details></v-text-field>
    <v-data-table-server class="ships" density="compact" :items-per-page="itemsPerPage" :headers="headers" :items="serverItems" :items-length="totalItems" :loading="loading" :search="search" item-value="_id" @update:options="loadItems">
      <template v-slot:item.id="{ item }">
        <v-list-item @click="selectShip(item)">
          <v-list-item-title class="font-weight-bold">{{ item?.name }}</v-list-item-title>
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
          title: "Layer",
          align: "start",
          sortable: false,
          key: "id",
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
          return this.$store.state.layers.listOpened;
        },
        set(value) {
          this.$store.state.layers.listOpened = value;
        },
      },
    },

    methods: {
      // Load items from server
      loadItems({ page, itemsPerPage }) {
        this.loading = true;

        this.$store
          .dispatch("layers/SEARCH", { page, itemsPerPage, searchText: this.search })
          .then(({ items, total }) => {
            this.serverItems = items;
            this.totalItems = total;
            this.loading = false;
          })
          .catch(() => {
            this.serverItems = [];
            this.totalItems = 0;
            this.loading = false;
          });
      },
    },
  };
</script>
<style>
  .layers .v-data-table__thead,
  .layers .v-data-table-footer__items-per-page {
    display: none !important;
  }

  .layers .v-table__wrapper {
    height: calc(100vh - 305px) !important;
  }

  .layers .v-data-table__tr td {
    padding: 0px !important;
  }
</style>
