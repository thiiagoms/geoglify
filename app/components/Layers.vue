<template>
  <v-toolbar
    dark
    class="fixed-bar"
    v-if="layersStoreInstance.isNavigationDrawerOpen"
  >
    <v-toolbar-title class="font-weight-black"> Layers </v-toolbar-title>
    <v-spacer></v-spacer>
    <v-btn icon @click="isNavigationLayersDrawerOpen = false">
      <v-icon>mdi-close</v-icon>
    </v-btn>
  </v-toolbar>
  <v-text-field
    v-model="layersStoreInstance.searchText"
    outlined
    clearable
    placeholder="Search layers by name or description"
    hide-details
  ></v-text-field>

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
          <v-list-item-action start>
            <v-checkbox-btn
              :disabled="!!item.isLoading"
              v-model="item.isActive"
              @change="handleCheckboxChange(item)"
            ></v-checkbox-btn>
          </v-list-item-action>
        </template>
      </v-list-item>
    </template>
  </v-virtual-scroll>
</template>

<script>
import { layersStore } from "~/stores/layersStore";

export default {
  data() {
    return {};
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
      return [...this.layersStoreInstance.filteredList.values()];
    },
  },

  methods: {
    handleCheckboxChange(layer) {
      if (layer.isActive) {
        layer.isLoading = true;

        this.layersStoreInstance.fetchFeaturesByLayer(layer._id).then(() => {
          layer.isLoading = false;
        });
      } else {
        this.layersStoreInstance.clearFeaturesForLayer(layer._id);
      }
    },
  },
};
</script>

<style scoped>
.item {
  border-bottom: 1px solid #e0e0e0;
}
</style>
