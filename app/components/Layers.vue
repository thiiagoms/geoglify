<template>
  <v-toolbar
    dark
    class="fixed-bar"
    v-if="layersStoreInstance.isNavigationDrawerOpen"
  >
    <v-toolbar-title class="font-weight-black"> Layers </v-toolbar-title>
    <v-spacer></v-spacer>
    <v-btn icon @click="openDialog()">
      <v-icon>mdi-plus</v-icon>
    </v-btn>
  </v-toolbar>

  <v-text-field
    v-model="layersStoreInstance.searchText"
    outlined
    clearable
    placeholder="Search layers by name or description"
    hide-details
  ></v-text-field>

  <v-progress-linear
    v-if="layersStoreInstance.isLoading"
    indeterminate
    color="primary"
  ></v-progress-linear>

  <v-virtual-scroll :items="filteredLayers" style="height: calc(100vh - 195px)">
    <!-- Render each ship item -->
    <template v-slot:default="{ item }">
      <v-list-item class="item">
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
              @change="handleCheckboxChange(item)"
              :disabled="layersStoreInstance.isLoading"
            ></v-checkbox-btn>
            <v-icon v-else color="primary" class="ma-2">
              mdi-loading mdi-spin
            </v-icon>
          </v-list-item-action>
        </template>

        <template v-slot:append>
          <v-btn
            icon="mdi-delete"
            variant="text"
            @click="deleteLayer(item._id)"
            size="small"
            color="red darken-1"
            :disabled="layersStoreInstance.isLoading"
          ></v-btn>
        </template>
      </v-list-item>
    </template>
  </v-virtual-scroll>

  <NewLayer :open="open" @update:open="updateOpenState" />
</template>

<script>
import { storeToRefs } from 'pinia'
import { layersStore } from "~/stores/layersStore";

export default {
  data() {
    return {
      open: false,
      loading: false,
    };
  },

  setup() {
    const layersStoreInstance = layersStore();
    return { layersStoreInstance };
  },

  beforeDestroy() {},

  mounted() {
    this.layersStoreInstance.fetchLayers();
  },

  computed: {
    filteredLayers() {
      return [...this.layersStoreInstance.layerList.values()];
    },
    teste()
    {
      console.log(this.layersStoreInstance.teste)
      return this.layersStoreInstance.teste;
    }
  },

  methods: {
    handleCheckboxChange(layer) {
      if (layer.isActive) {
        this.layersStoreInstance.fetchFeaturesByLayer(layer._id);
      } else {
        this.layersStoreInstance.clearFeaturesForLayer(layer._id);
      }
    },

    openDialog() {
      this.open = true;
    },
    updateOpenState(value) {
      this.open = value;
    },

    deleteLayer(layerId) {
      this.layersStoreInstance.deleteLayer(layerId);
    },
  },
};
</script>

<style scoped>
.item {
  border-bottom: 1px solid #e0e0e0;
  min-height: 60px;
}
</style>
