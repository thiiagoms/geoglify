<template>
  <v-toolbar dark class="fixed-bar" v-if="isNavigationDrawerOpen">
    <v-toolbar-title>
      <v-list-item class="px-0">
        <v-list-item-title class="text-h6 font-weight-black"
          >Layers</v-list-item-title
        >
        <v-list-item-subtitle class="text-caption"
          >({{ filteredLayers.length }} /
          {{ layersStoreInstance.layerList.size }})</v-list-item-subtitle
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
          <div class="legend-container">
            <Legend
              :style.sync="item.style"
              :type.sync="item.type"
              :id="item._id"
            ></Legend>
          </div>

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
              @change="handleLayerCheckboxChange(item)"
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
              <v-list-item @click="openDatatable(item._id)">
                <v-list-item-title>Show Data</v-list-item-title>
              </v-list-item>
              <v-list-item @click="openLayerEditor(item._id, item)">
                <v-list-item-title>Edit Layer</v-list-item-title>
              </v-list-item>
              <v-list-item
                @click="openLayerStyleEditor(item._id, item.type, item.style)"
              >
                <v-list-item-title>Style Layer</v-list-item-title>
              </v-list-item>
              <v-list-item @click="openLayerDeletor(item._id)">
                <v-list-item-title>Delete Layer</v-list-item-title>
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

  <EditStyle
    :open="openEditStyleDialog"
    :style="styleDataToEdit"
    :layerType="layerTypeToEditStyle"
    :layerId="layerIdToEditStyle"
    @update:open="updateOpenEditStyleDialogState"
  />
</template>

<script>
export default {
  data() {
    return {
      openCreateDialog: false,
      openEditDialog: false,
      openDeleteDialog: false,
      openEditStyleDialog: false,
      layerDataToEdit: null,
      styleDataToEdit: null,
      layerIdToEdit: null,
      layerIdToDelete: null,
      layerTypeToEditStyle: null,
      layerIdToEditStyle: null,
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

    const layersStoreInstance = layersStore();
    return { layersStoreInstance, debounce: createDebounce() };
  },

  mounted() {
    this.layersStoreInstance.fetchLayers();
  },

  computed: {
    filteredLayers() {
      return [...this.layersStoreInstance.filteredList.values()];
    },
    isNavigationDrawerOpen() {
      return this.layersStoreInstance.isNavigationDrawerOpen;
    },
    search: {
      get() {
        return this.layersStoreInstance.searchText;
      },
      set(value) {
        this.debounce(() => {
          this.layersStoreInstance.searchText = value;
        }, 300);
      },
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

    openLayerStyleEditor(layerId, layerType, styleData) {
      this.layerIdToEditStyle = layerId;
      this.layerTypeToEditStyle = layerType;
      this.styleDataToEdit = styleData || {};
      this.openEditStyleDialog = true;
    },

    openDatatable(layerId) {
      this.layersStoreInstance.setLayerIdToView(layerId);
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

    updateOpenEditStyleDialogState(value) {
      this.openEditStyleDialog = value;
    },
  },
};
</script>

<style scoped>
.layer-item {
  border-bottom: 1px solid #e0e0e0;
  min-height: 60px;
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
