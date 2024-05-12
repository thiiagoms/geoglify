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

    <v-data-table-server class="layers" density="compact" :items-per-page="itemsPerPage" :headers="headers" :items="layers" :items-length="total" :loading="loading" :search="search" item-value="_id" @update:options="loadItems">
      <template v-slot:item.id="{ item }">
        <v-list-item>
          <template v-slot:prepend>
            <v-list-item-action>
              <v-checkbox-btn v-model="item.selected" @change="handleLayerCheckboxChange(item)"></v-checkbox-btn>
            </v-list-item-action>
          </template>

          <v-list-item-title>
            <div class="legend-container" v-if="!!item.style">
              <Legend :style.sync="item.style" :type.sync="item.type" :id="item._id" :mini="true"></Legend>
            </div>

            <span class="text-subtitle-1 font-weight-bold">{{ item?.name }} </span>
          </v-list-item-title>

          <v-list-item-subtitle>{{ item?.description }}</v-list-item-subtitle>

          <template v-slot:append>
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn icon="mdi-dots-vertical" v-bind="props" variant="text" density="compact"></v-btn>
              </template>

              <v-list density="compact">
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

  <LayersDeletor :open="openDeleteDialog" :layerId="layerIdToDelete" @update:open="updateOpenDeleteDialogState" />

  <LayersStyleEditor :open="openStyleDialog" :style="layerStyleToEdit" :layerType="layerType" :layerId="layerIdToEditStyle" @update:open="updateOpenStyleDialogState" />
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
      loading: true,
      search: "",
      openCreateDialog: false,
      openEditDialog: false,
      openUploadDialog: false,
      openDeleteDialog: false,
      openStyleDialog: false,
      layerIdToEdit: null,
      layerDataToEdit: null,
      layerIdToDelete: null,
      layerIdToEditStyle: null,
      layerStyleToEdit: null,
      layerType: null,
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

      // Get layers from store
      layers() {
        return this.$store.state.layers.list;
      },

      // Get total from store
      total() {
        return this.$store.state.layers.total;
      },
    },

    watch: {
      openCreateDialog: "handleDialogChange",
      openEditDialog: "handleDialogChange",
      openUploadDialog: "handleDialogChange",
      openDeleteDialog: "handleDialogChange",
      openStyleDialog: "handleDialogChange",
    },

    methods: {
      // Handle dialog change
      handleDialogChange(value) {
        if (!value) {
          this.loadItems({ page: 1, itemsPerPage: this.itemsPerPage });
        }
      },
      // Load items from server
      async loadItems({ page, itemsPerPage }) {
        // Set loading state
        this.loading = true;

        // Fetch layers from server
        await this.$store.dispatch("layers/SEARCH", { page, itemsPerPage, searchText: this.search });

        // Set loading state
        this.loading = false;
      },

      // Handle layer checkbox change
      async handleLayerCheckboxChange(layer) {
        if (layer.selected) {
          await this.$store.dispatch("layers/GET_FEATURES", layer.id);
        } else {
          await this.$store.dispatch("layers/CLEAR_FEATURES", layer.id);
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

      // Open layer deletor
      openLayerDeletor(layerId) {
        this.layerIdToDelete = layerId;
        this.openDeleteDialog = true;
      },

      // Update open delete dialog state
      updateOpenDeleteDialogState(value) {
        this.openDeleteDialog = value;
      },

      // Open layer style editor
      openLayerStyleEditor(layerId, layerType, layerStyle) {
        this.layerIdToEditStyle = layerId;
        this.layerType = layerType;
        this.layerStyleToEdit = layerStyle;
        this.openStyleDialog = true;
      },

      // Update open style dialog state
      updateOpenStyleDialogState(value) {
        this.openStyleDialog = value;
      },
    },
  };
</script>
<style>
  .layers .v-data-table__th,
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
