<template>
  <v-text-field
    v-model="searchText"
    outlined
    clearable
    placeholder="Search layers by name or description or type"
    hide-details
  ></v-text-field>

  <v-virtual-scroll :items="layerList" style="height: calc(100vh - 195px)">
    <!-- Render each ship item -->
    <template v-slot:default="{ item }">
      <v-list-item class="item">
        <v-list-item-title class="font-weight-bold">{{
          item.name || "N/A"
        }}</v-list-item-title>

        <v-list-item-subtitle class="text-caption">
          {{ item.description || "N/A" }}
        </v-list-item-subtitle>

        <template v-slot:prepend>
          <v-avatar color="grey-lighten-1">
            <v-icon color="white">mdi-markers</v-icon>
          </v-avatar>
        </template>

        <template v-slot:append="{ isActive }">
          <v-list-item-action start>
            <v-checkbox-btn :model-value="isActive"></v-checkbox-btn>
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
    const layers = layersStore();
    return { layers };
  },

  beforeDestroy() {},

  mounted() {
    this.layers.fetchLayers();
  },

  computed: {
    layerList() {
      return [...this.layers?.list?.values()];
    },
  },

  methods: {
    handleImageError(e) {
      // Handle image loading errors
      e.target.src = "https://hatscripts.github.io/circle-flags/flags/xx.svg";
    },
  },
};
</script>
<style scoped>
.item {
  border-bottom: 1px solid #e0e0e0;
}
</style>