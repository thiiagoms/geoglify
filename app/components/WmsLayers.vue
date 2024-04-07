<template>
  <v-toolbar
    class="fixed-bar"
    color="white"
    dark
    style="border-bottom: 1px solid #ccc"
    v-if="isNavigationDrawerOpen"
  >
    <v-toolbar-title>
      <v-list-item class="px-3">
        <v-list-item-title class="text-h6 font-weight-black"
          >WMS Layers</v-list-item-title
        >
        <v-list-item-subtitle class="text-caption"
          >({{ filteredLayers.length }} /
          {{ wmsLayersStoreInstance.layerList.size }})</v-list-item-subtitle
        >
      </v-list-item>
    </v-toolbar-title>

    <v-spacer></v-spacer>
    <v-btn icon @click="openLayerCreator()" density="compact">
      <v-icon>mdi-plus</v-icon>
    </v-btn>
  </v-toolbar>

  <v-text-field
    v-model="search"
    outlined
    clearable
    placeholder="Search layers by name or description"
    hide-details
  ></v-text-field>

  <v-virtual-scroll :items="filteredLayers" style="height: calc(100vh - 195px)">
    <!-- Render each layer item -->
    <template v-slot:default="{ item }">
      <v-list-item class="layer-item px-1">
        <v-list-item-title>
          <span class="text-subtitle-1 font-weight-bold">{{
            item.name || "N/A"
          }}</span>
        </v-list-item-title>

        <v-list-item-subtitle class="text-caption">
          {{ item.description || "N/A" }}
        </v-list-item-subtitle>

        <template v-slot:prepend="{ isActive }">
          <v-list-item-action>
            <v-checkbox-btn
              v-if="!item.isLoading"
              v-model="item.isActive"
            ></v-checkbox-btn>
            <v-icon v-else color="primary" class="ma-2">
              mdi-loading mdi-spin
            </v-icon>
          </v-list-item-action>
        </template>

        <template v-slot:append>
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn
                icon="mdi-dots-vertical"
                v-bind="props"
                variant="text"
                density="compact"
              ></v-btn>
            </template>

            <v-list density="compact">
              <v-list-item @click="openLayerEditor(item._id, item)">
                <v-list-item-title>Edit WMS</v-list-item-title>
              </v-list-item>
              <v-list-item @click="openLayerDeletor(item._id)">
                <v-list-item-title>Delete WMS</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-list-item>
    </template>
  </v-virtual-scroll>

  <CreateWmsLayer
    :open="openCreateDialog"
    @update:open="updateOpenCreateDialogState"
  />

  <EditWmsLayer
    :open="openEditDialog"
    :layerData="layerDataToEdit"
    :layerId="layerIdToEdit"
    @update:open="updateOpenEditDialogState"
  />

  <DeleteWmsLayer
    :open="openDeleteDialog"
    :layerId="layerIdToDelete"
    @update:open="updateOpenDeleteDialogState"
  />
</template>

<script>
export default {
  data() {
    return {
      openCreateDialog: false,
      openEditDialog: false,
      openDeleteDialog: false,
      layerDataToEdit: null,
      layerIdToEdit: null,
      layerIdToDelete: null,
    };
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

    const wmsLayersStoreInstance = wmsLayersStore();
    return { wmsLayersStoreInstance, debounce: createDebounce() };
  },

  mounted() {
    this.wmsLayersStoreInstance.fetchLayers();
  },

  computed: {
    filteredLayers() {
      return [...this.wmsLayersStoreInstance.filteredList.values()];
    },
    isNavigationDrawerOpen() {
      return this.wmsLayersStoreInstance.isNavigationDrawerOpen;
    },
    search: {
      get() {
        return this.wmsLayersStoreInstance.searchText;
      },
      set(value) {
        this.debounce(() => {
          this.wmsLayersStoreInstance.searchText = value;
        }, 300);
      },
    },
  },

  methods: {
    openLayerCreator() {
      this.openCreateDialog = true;
    },

    openLayerEditor(layerId, layerData) {
      this.layerIdToDelete = layerId;
      this.layerDataToEdit = layerData;
      this.openEditDialog = true;
    },

    openLayerDeletor(layerId) {
      this.layerIdToDelete = layerId;
      this.openDeleteDialog = true;
    },

    updateOpenCreateDialogState(value) {
      this.openCreateDialog = value;
    },

    updateOpenEditDialogState(value) {
      this.openEditDialog = value;
    },

    updateOpenDeleteDialogState(value) {
      this.openDeleteDialog = value;
    },
  },
};
</script>

<style scoped>
.layer-item {
  border-bottom: 1px solid #e0e0e0;
  min-height: 60px;
}
</style>
