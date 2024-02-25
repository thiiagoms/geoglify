<template>
  <v-card style="height: 100%">
    <!-- Toolbar with feature detail title -->
    <v-toolbar color="white" dark>
      <v-toolbar-title class="font-weight-black text-h6">
        {{ layerName }}
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <div style="width: 200px">
        <v-text-field
          v-model="search"
          append-inner-icon="mdi-magnify"
          label="Search"
          hide-details
          variant="outlined"
          density="compact"
        ></v-text-field>
      </div>

      <!-- Close button in the toolbar -->
      <v-btn icon @click="closeDialog">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>
    <!-- Divider between toolbar and feature information -->
    <v-divider></v-divider>
    <v-card-text
      class="pa-0"
      style="height: calc(100% - 65px); overflow-y: hidden"
    >
      <v-data-table
        :headers="tableHeaders"
        :items="filteredFeatures"
        :loading="loading"
        density="compact"
        :fixed-header="true"
        style="height: calc(100%)"
      >
        <template v-slot:no-data>
          <v-alert :value="true" icon="mdi-alert">
            No features found for this layer
          </v-alert>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-icon
            class="mr-2"
            size="small"
            @click="() => layersStoreInstance.setSelectedFeature(item)"
            >mdi-eye</v-icon
          >
        </template>

        <template v-slot:loading>
          <v-skeleton-loader type="table-row@10"></v-skeleton-loader>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  props: {
    layerId: String,
  },
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

    const layersStoreInstance = layersStore();
    return { layersStoreInstance, debounce: createDebounce() };
  },
  data() {
    return {
      tableHeaders: [],
      layerFeatures: [],
      loading: false,
    };
  },
  watch: {
    layerId: {
      immediate: true,
      handler() {
        this.tableHeaders = [];
        this.fetchLayerFeatures();
      },
    },
  },
  computed: {
    layerName() {
      return this.layersStoreInstance.layerList.get(this.layerId)?.name;
    },
    filteredFeatures() {
      return this.layersStoreInstance.filteredFeaturesList;
    },
    search: {
      get() {
        return this.layersStoreInstance.searchFeaturesText;
      },
      set(value) {
        this.debounce(() => {
          this.layersStoreInstance.searchFeaturesText = value;
        }, 300);
      },
    },
  },
  methods: {
    closeDialog() {
      this.layersStoreInstance.setLayerIdToView(null);
    },
    async fetchLayerFeatures() {
      this.loading = true;

      let features = await this.layersStoreInstance.getFeaturesDetailsByLayer(
        this.layerId
      );

      if (features.length > 0) {
        this.tableHeaders = Object.keys(features[0]).map((key) => ({
          title: key,
          key: key,
          width: 500,
          sortable: true,
        }));
      }

      this.tableHeaders.push({
        title: "",
        align: "start",
        sortable: false,
        key: "actions",
      });

      this.loading = false;
    },
  },
};
</script>

<style>
.v-data-table__th {
  background-color: rgb(55, 71, 79);
  font-weight: bolder;
  text-transform: uppercase;
}
</style>
