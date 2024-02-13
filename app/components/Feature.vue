<template>
  <v-card v-model="dialogOpened" class="pa-0" flat>
    <!-- Toolbar with ship name and flag -->
    <v-toolbar color="white" dark>
      <v-toolbar-title class="font-weight-black text-h6">
        <v-list density="compact">
          <v-list-item class="pa-0 ma-0">
            <v-list-item-title class="font-weight-black">
              Feature Detail
            </v-list-item-title>
            <v-list-item-subtitle></v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-toolbar-title>
      <!-- Close button in the toolbar -->
      <v-btn icon @click="dialogOpened = null">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>
    <!-- Divider between toolbar and ship information -->
    <v-divider></v-divider>
    <v-card-text
      class="pa-0"
      style="height: calc(100vh - 140px); overflow: auto"
    >
      <v-table>
        <tbody>
          <tr v-for="(value, key) in feature.properties" :key="key">
            <td class="font-weight-bold text-uppercase">{{ key }}</td>
            <td>{{ value }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  setup() {
    // Use layersStore to get ship data
    const layersStoreInstance = layersStore();
    return { layersStoreInstance };
  },

  computed: {
    // Computed property for dialog state
    dialogOpened: {
      get() {
        return !!this.layersStoreInstance?.selectedFeature;
      },
      set(value) {
        this.layersStoreInstance.selectedFeature = value;
      },
    },
    feature: {
      get() {
        return this.layersStoreInstance?.selectedFeature;
      },
    },
  },
};
</script>
