<template>
  <v-navigation-drawer v-model="dialogOpened" :location="$vuetify.display.mobile ? 'bottom' : undefined" style="z-index: 1001" permanent :width="$vuetify.display.mobile ? '100%' : '400'" v-if="dialogOpened">
    <v-toolbar class="fixed-bar" color="white" dark style="border-bottom: 1px solid #ccc">
      <v-toolbar-title class="text-h5 font-weight-black pl-4"> Layers </v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn icon @click="openLayerCreator()" density="compact">
        <v-icon>mdi-plus</v-icon>
      </v-btn>

      <v-btn icon @click="dialogOpened = false" density="compact" class="ml-1">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>

    <!-- Search input field -->
    <v-text-field v-model="search" outlined clearable placeholder="Search layers" hide-details></v-text-field>
    <v-data-table-server class="ships" density="compact" :items-per-page="itemsPerPage" :headers="headers" :items="serverItems" :items-length="totalItems" :loading="loading" :search="search" item-value="_id" @update:options="loadItems">
      <template v-slot:item.id="{ item }">
        <v-list-item>
          <template v-slot:prepend>
            <v-list-item-action>
              <v-checkbox-btn v-if="!item.isLoading" v-model="item.isActive" @change="handleLayerCheckboxChange(item)"></v-checkbox-btn>
              <v-icon v-if="item.isLoading" color="primary" class="ma-2"> mdi-loading mdi-spin </v-icon>
            </v-list-item-action>
          </template>

          <v-list-item-title>
            <div class="legend-container" v-if="!!item.style">
              <Legend :style.sync="item.style" :type.sync="item.type" :id="item._id"></Legend>
            </div>

            <span class="text-subtitle-1 font-weight-bold">{{ item?.name }}</span>
          </v-list-item-title>

          <v-list-item-subtitle>{{ item?.description }}</v-list-item-subtitle>

          <template v-slot:append>
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn icon="mdi-dots-vertical" v-bind="props" variant="text" density="compact"></v-btn>
              </template>

              <v-list density="compact">
                <v-list-item @click="openDatatable(item.id)">
                  <v-list-item-title>Show Data</v-list-item-title>
                </v-list-item>
                <v-list-item @click="openLayerEditor(item.id, item)">
                  <v-list-item-title>Edit Layer</v-list-item-title>
                </v-list-item>
                <v-list-item @click="openLayerStyleEditor(item.id, item.type, item.style)">
                  <v-list-item-title>Style Layer</v-list-item-title>
                </v-list-item>
                <v-list-item @click="openLayerUploader(item.id, item)">
                  <v-list-item-title>Upload Data</v-list-item-title>
                </v-list-item>
                <v-list-item @click="openLayerDeletor(item.id)">
                  <v-list-item-title>Delete Layer</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
        </v-list-item>
      </template>
    </v-data-table-server>
  </v-navigation-drawer>

  <LayersCreator :open="openCreateDialog" @update:open="updateOpenCreateDialogState" />

  <LayersEditor :open="openEditDialog" :layerData="layerDataToEdit" :layerId="layerIdToEdit" @update:open="updateOpenEditDialogState" />

  <LayersUpload :open="openUploadDialog" :layerId="layerIdToEdit" @update:open="updateOpenUploadDialogState" />
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
      openCreateDialog: false,
      openEditDialog: false,
      openUploadDialog: false,
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

      // Handle layer checkbox change
      async handleLayerCheckboxChange(layer) {
        if (layer.isActive) {
          layer.isLoading = true;
          await this.$store.dispatch("layers/GET_FEATURES", layer.id);
          layer.isLoading = false;
        } else {
          layer.isLoading = true;
          await this.$store.dispatch("layers/CLEAR_FEATURES", layer.id);
          layer.isLoading = false;
        }
      },

      // Open layer creator
      openLayerCreator() {
        this.openCreateDialog = true;
      },

      // Update open create dialog state
      updateOpenCreateDialogState(value) {
        this.openCreateDialog = value;
      },

      // Open layer editor
      openLayerEditor(layerId, layerData) {
        this.layerIdToEdit = layerId;
        this.layerDataToEdit = layerData;
        this.openEditDialog = true;
      },

      // Update open edit dialog state
      updateOpenEditDialogState(value) {
        this.openEditDialog = value;
      },

      // Open layer uploader
      openLayerUploader(layerId) {
        this.layerIdToEdit = layerId;
        this.openUploadDialog = true;
      },

      // Update open upload dialog state
      updateOpenUploadDialogState(value) {
        this.openUploadDialog = value;
      },

      // Open layer style editor
      openLayerStyleEditor() {},

      // Open layer deletor
      openLayerDeletor() {},

      // Open datatable
      openDatatable() {},
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

  .legend-container {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #fdfdfd;
    border-radius: 50%;
    height: 30px;
    width: 30px;
    float: left;
    margin-left: -5px;
    margin-top: -1px;
  }
</style>
