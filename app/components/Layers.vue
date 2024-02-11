<template>
  <v-toolbar dark class="fixed-bar" v-if="isNavigationDrawerOpen">
    <v-toolbar-title class="font-weight-black"> Layers </v-toolbar-title>
    <v-spacer></v-spacer>
    <v-btn icon @click="openLayerCreator()" density="compact">
      <v-icon>mdi-plus</v-icon>
    </v-btn>
  </v-toolbar>

  <v-text-field
    v-model="searchText"
    outlined
    clearable
    placeholder="Search layers by name or description"
    hide-details
  ></v-text-field>

  <v-progress-linear
    v-if="isLoading"
    indeterminate
    color="primary"
  ></v-progress-linear>

  <v-virtual-scroll :items="filteredLayers" style="height: calc(100vh - 195px)">
    <!-- Render each layer item -->
    <template v-slot:default="{ item }">
      <v-list-item class="layer-item">
        <v-list-item-title class="font-weight-bold">{{
          item.name || "N/A"
        }}</v-list-item-title>

        <v-list-item-subtitle class="text-caption">
          {{ item.description || "N/A" }}
        </v-list-item-subtitle>

        <template v-slot:prepend="{ isActive }">
          <v-list-item-action>
            <v-checkbox-btn
              v-if="!item.isLoading"
              v-model="item.isActive"
              @change="handleLayerCheckboxChange(item)"
              :disabled="isLoading"
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
                <v-list-item-title>Edit</v-list-item-title>
              </v-list-item>
              <v-list-item @click="openLayerDeletor(item._id)">
                <v-list-item-title>Delete</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-list-item>
    </template>
  </v-virtual-scroll>

  <CreateLayer
    :open="openCreateDialog"
    @update:open="updateOpenCreateDialogState"
  />
  <EditLayer
    :open="openEditDialog"
    :layerData="layerDataToEdit"
    :layerId="layerIdToEdit"
    @update:open="updateOpenEditDialogState"
  />
  <DeleteLayer
    :open="openDeleteDialog"
    :layerId="layerIdToDelete"
    @update:open="updateOpenDeleteDialogState"
  />
</template>

<script>
import { layersStore } from "~/stores/layersStore";

export default {
  data() {
    return {
      openCreateDialog: false,
      openEditDialog: false,
      openDeleteDialog: false,
      isLoading: false,
      layerDataToEdit: null,
      layerIdToEdit: null,
      layerIdToDelete: null,
    };
  },

  setup() {
    const layersStoreInstance = layersStore();
    return { layersStoreInstance };
  },

  mounted() {
    this.layersStoreInstance.fetchLayers();
  },

  computed: {
    filteredLayers() {
      return [...this.layersStoreInstance.layerList.values()];
    },
    isNavigationDrawerOpen() {
      return this.layersStoreInstance.isNavigationDrawerOpen;
    },
    searchText() {
      return this.layersStoreInstance.searchText;
    },
  },

  methods: {
    handleLayerCheckboxChange(layer) {
      if (layer.isActive) {
        this.layersStoreInstance.fetchFeaturesByLayer(layer._id);
      } else {
        this.layersStoreInstance.clearFeaturesForLayer(layer._id);
      }
    },

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
