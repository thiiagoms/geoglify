<template>
  <v-card style="height: 100%">
    <!-- Toolbar with feature detail title -->
    <v-toolbar color="white" dark>
      <v-toolbar-title class="font-weight-black text-h6">
        {{ layerName }}
      </v-toolbar-title>
      <!-- Close button in the toolbar -->
      <v-btn icon @click="closeDialog">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>
    <!-- Divider between toolbar and feature information -->
    <v-divider></v-divider>
    <v-card-text
      class="pa-0"
      ref="cardText"
      style="height: calc(100% - 65px); overflow-y: hidden"
    >
      <v-data-table
        :headers="tableHeaders"
        :items="layerFeatures"
        :loading="loading"
        density="compact"
        :fixed-header="true"
        :height="availableHeight"
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
    const layersStoreInstance = layersStore();
    return { layersStoreInstance };
  },
  data() {
    return {
      tableHeaders: [],
      layerFeatures: [],
      loading: false,
      availableHeight: 320, // Default height
    };
  },
  mounted() {
    window.addEventListener("resize", () => {
      this.getAvailableHeight();
    });
    this.getAvailableHeight();
  },
  watch: {
    layerId: {
      immediate: true,
      handler() {
        this.tableHeaders = [];
        this.layerFeatures = [];
        this.fetchLayerFeatures();
      },
    },
  },
  computed: {
    layerName() {
      return this.layersStoreInstance.layerList.get(this.layerId)?.name;
    },
  },
  methods: {
    closeDialog() {
      this.layersStoreInstance.setLayerIdToView(null);
    },
    async fetchLayerFeatures() {
      this.loading = true;

      this.layerFeatures =
        await this.layersStoreInstance.getFeaturesDetailsByLayer(this.layerId);

      if (this.layerFeatures.length > 0) {
        this.tableHeaders = Object.keys(this.layerFeatures[0]).map((key) => ({
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
    getAvailableHeight() {
      setTimeout(() => {
        this.availableHeight = this.$refs.cardText.$el.clientHeight - 55;
      }, 500);
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
