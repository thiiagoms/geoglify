<template>
  <v-dialog v-model="dialogVisible" max-width="80%" persistent scrollable>
    <v-card>
      <!-- Toolbar with feature detail title -->
      <v-toolbar color="white" dark>
        <v-toolbar-title class="font-weight-black text-h6">
          Layer Datatable
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
        style="height: calc(100vh - 140px); overflow: auto"
      >
        <v-data-table
          :headers="tableHeaders"
          :items="layerFeatures"
          :loading="loading"
        >
          <template v-slot:no-data>
            <v-alert :value="true" color="error" icon="mdi-alert">
              No features found for this layer
            </v-alert>
          </template>
          <template v-slot:header.id="{ column }">
            {{ column.title.toUpperCase() }}
          </template>
          <template v-slot:loading>
            <v-skeleton-loader type="table-row@10"></v-skeleton-loader>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    open: Boolean,
    layerId: String,
  },
  setup() {
    const layersStoreInstance = layersStore();
    return { layersStoreInstance };
  },
  data() {
    return {
      dialogVisible: false,
      tableHeaders: [],
      layerFeatures: [],
      loading: false,
    };
  },
  watch: {
    open(value) {
      if (value) {
        this.fetchLayerFeatures();
      }
      this.dialogVisible = value;
    },
    dialogVisible(value) {
      this.$emit("update:open", value);
    },
  },
  methods: {
    closeDialog() {
      this.dialogVisible = false;
    },
    async fetchLayerFeatures() {
      this.loading = true;

      this.layerFeatures =
        await this.layersStoreInstance.getFeaturesDetailsByLayer(this.layerId);

      if (this.layerFeatures.length > 0) {
        this.tableHeaders = Object.keys(this.layerFeatures[0]).map((key) => ({
          title: key,
          key: key,
          class: "text-uppercase font-weight-black",
        }));

        console.log(this.tableHeaders);
      }

      this.loading = false;
    },
  },
};
</script>
