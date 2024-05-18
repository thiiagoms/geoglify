<template>
 <v-navigation-drawer v-model="dialogOpened" :location="$vuetify.display.mobile ? 'bottom' : 'right'" style="z-index: 1002; right: 0px !important" permanent :width="$vuetify.display.mobile ? '100%' : '400'" v-if="feature">
    <!-- Toolbar with ship name and flag -->
    <v-toolbar class="fixed-bar" color="white" dark style="border-bottom: 1px solid #ccc">
      <v-toolbar-title class="text-h5 font-weight-bold pl-4"> Feature Details </v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn icon @click="dialogOpened = false" density="compact" class="ml-1">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>
    <!-- Divider between toolbar and ship information -->
    <v-divider></v-divider>
    <v-card-text class="pa-0" style="height: calc(100vh - 140px); overflow: auto">
      <v-table>
        <tbody>
          <tr v-for="(value, key) in feature.properties" :key="key">
            <td class="font-weight-bold text-uppercase">{{ key }}</td>
            <td>{{ value }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-navigation-drawer>
</template>

<script>
  export default {
    computed: {
      // Computed property for dialog state
      dialogOpened: {
        get() {
          return !!this.$store.state.features.selected;
        },
        set(value) {
          this.$store.state.features.selected = value;
        },
      },
      feature: {
        get() {
          return JSON.parse(JSON.stringify(this.$store.state.features.selected));
        },
      },
    },
  };
</script>
