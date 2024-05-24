<template>
  <v-navigation-drawer v-model="dialogOpened" :location="$vuetify.display.mobile ? 'bottom' : undefined" style="z-index: 1001" permanent :width="$vuetify.display.mobile ? '100%' : '400'" v-if="dialogOpened">
    <v-toolbar class="fixed-bar" color="white" dark style="border-bottom: 1px solid #ccc">
      <v-toolbar-title class="text-h5 font-weight-bold pl-4"> Layers </v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn icon @click="openLayerCreator()" density="compact" :disabled="!isAuthenticated"> <v-icon>mdi-plus</v-icon></v-btn>

      <v-btn icon @click="dialogOpened = false" density="compact" class="ml-1">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>

    <!-- Search input field -->
    <v-text-field v-model="search" outlined clearable placeholder="Search layers" hide-details></v-text-field>

    <v-data-table-server class="layers" density="compact" :items-per-page="itemsPerPage" :headers="headers" :items="layers" :items-length="total" :loading="loading" :search="search" item-value="_id" @update:options="loadItems">
      <template v-slot:item.id="{ item }">
        <v-card class="mt-1 mx-1 border" variant="outlined" density="comfortable">
          <template v-slot:prepend>
            <div class="legend-container" v-if="!!item.style">
              <Legend :style.sync="item.style" :type.sync="item.type" :id="item._id" :mini="true"></Legend>
            </div>
          </template>
          <template v-slot:title>
            <span class="font-weight-bold text-subtitle-1">{{ item?.name }}</span>
          </template>
          <template v-slot:subtitle>
            <span class="text-subtitle-2">{{ item?.datasource || "N/A" }}</span>
          </template>

          <template v-slot:append>
            <v-checkbox-btn v-model="item.is_active" @change="updateLayerFeatures(item)" :disabled="item.loading" v-if="!item.loading"></v-checkbox-btn>
            <v-progress-circular indeterminate size="25" color="black" v-else class="mx-2"></v-progress-circular>

            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn icon="mdi-dots-vertical" v-bind="props" variant="text" density="compact"></v-btn>
              </template>

              <v-list density="compact" :lines="false" class="px-0">
                <v-list-item @click="openLayerEditor(item.id, item)" :disabled="!isAuthenticated">
                  <template v-slot:prepend>
                    <v-icon icon="mdi-pencil" color="black" size="small"></v-icon>
                  </template>
                  <v-list-item-title class="text-body-1 ml-1">Edit</v-list-item-title>
                </v-list-item>
                <v-list-item @click="openLayerStyleEditor(item.id, item.type, item.style)" :disabled="!isAuthenticated">
                  <template v-slot:prepend>
                    <v-icon icon="mdi-format-paint" color="black" size="small"></v-icon>
                  </template>
                  <v-list-item-title class="text-body-1 ml-1">Style</v-list-item-title>
                </v-list-item>
                <v-list-item @click="openLayerUploader(item.id, item)" :disabled="!isAuthenticated">
                  <template v-slot:prepend>
                    <v-icon icon="mdi-upload" color="black" size="small"></v-icon>
                  </template>
                  <v-list-item-title class="text-body-1 ml-1">Load data</v-list-item-title>
                </v-list-item>
                <v-list-item @click="openLayerDeletor(item.id)" :disabled="!isAuthenticated">
                  <template v-slot:prepend>
                    <v-icon icon="mdi-delete" color="red" size="small"></v-icon>
                  </template>
                  <v-list-item-title class="text-body-1 ml-1">Delete</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
        </v-card>
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
  const { status } = useAuth();

  export default {
    props: ["map"],

    data: () => ({
      itemsPerPage: 100,
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
      // Check if the user is authenticated
      isAuthenticated() {
        return status.value === "authenticated";
      },

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

        if (this.layers && this.layers.length > 0) {
          this.layers.forEach((layer) => {
            this.updateLayerFeatures(layer);
          });
        }

        // Set loading state
        this.loading = false;
      },

      // Handle layer checkbox change
      async updateLayerFeatures(layer) {
        if (layer.is_active) {
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

    mounted() {
      this.loadItems({ page: 1, itemsPerPage: this.itemsPerPage });
    },
  };
</script>
<style>
  .layers .v-data-table__th,
  .layers .v-data-table-footer__items-per-page {
    display: none !important;
  }

  .layers .v-table__wrapper {
    height: calc(100dvh - 305px) !important;
  }

  .layers .v-data-table__tr td {
    padding: 0px !important;
  }

  .layers .v-table__wrapper > table > tbody > tr:not(:last-child) > td,
  .layers .v-table__wrapper > table > tbody > tr:not(:last-child) > th {
    border-bottom: none !important;
  }

  .legend-container {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgb(240, 238, 238);
    height: 31px;
    width: 31px;
    float: left;
    border-radius: 5px;
    margin-right: 5px;
    margin-left: 0px;
    margin-top: 0px;
  }
</style>
