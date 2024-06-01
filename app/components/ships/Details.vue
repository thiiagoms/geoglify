<template>
  <v-navigation-drawer v-model="dialogOpened" :location="$vuetify.display.mobile ? 'bottom' : 'right'" style="z-index: 1003; right: 0px !important" permanent :width="$vuetify.display.mobile ? '100%' : '400'" v-if="selected">
    <v-card class="pa-0" flat>
      <!-- Toolbar with ship name and flag -->
      <v-toolbar color="white" dark>
        <v-toolbar-title class="font-weight-bold text-h6">
          <v-list density="compact">
            <v-list-item class="pa-2 ma-0">
              <template v-slot:prepend>
                <!-- Display ship flag -->
                <v-avatar size="30">
                  <component :is="'svgo-' + (selected?.countrycode || 'xx').toLowerCase()" filled class="flag"></component>
                </v-avatar>
              </template>
              <!-- Display ship name and MMSI -->
              <v-list-item-title class="font-weight-bold">
                {{ selected?.mmsi ?? "N/A" }}
              </v-list-item-title>
              <v-list-item-subtitle>{{ selected?.shipname ?? "N/A" }}</v-list-item-subtitle>
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
      <v-card-text class="pa-0" style="height: calc(100dvh - 250px); overflow: auto">
        <!-- Display ship icon -->
        <v-img :src="'https://photos.marinetraffic.com/ais/showphoto.aspx?mmsi=' + selected.mmsi">
          <template v-slot:error> <v-img class="mx-auto" src="https://placehold.co/600x400?text=No+Photo"></v-img> </template
        ></v-img>
        <!-- Table for displaying ship information -->
        <v-table density="compact">
          <tbody>
            <!-- Use v-for to loop through ship information -->
            <template v-for="(value, label) in selected">
              <template v-if="value !== null && value !== undefined && value !== '' && label != '_id' && label != 'countrycode'">
                <tr :key="label">
                  <!-- Display label in bold -->
                  <td class="font-weight-bold text-uppercase">{{ label }}</td>
                  <!-- Conditionally format and display ship information -->
                  <template v-if="label === 'eta' || label === 'utc'">
                    <td class="px-0 text-uppercase">
                      {{ formatDate(value) }}
                    </td>
                  </template>
                  <template v-else>
                    <td class="px-0 text-uppercase">{{ value }}</td>
                  </template>
                </tr>
              </template>
            </template>
          </tbody>
        </v-table>
      </v-card-text>
      <v-card-actions>
        <!-- toggle show path button -->
        <v-btn @click="showPath = true" :color="showPath ? 'blue' : 'grey'" variant="tonal" block>
          <v-icon>mdi-map-marker-path</v-icon>
          {{ showPath ? "Hide Path" : "Show Path" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-navigation-drawer>
</template>

<script>
  import configs from "~/helpers/configs";

  export default {
    data: () => ({
      showPath: false,
    }),
    computed: {
      // Computed property for dialog state
      dialogOpened: {
        get() {
          return !!this.$store.state.ships.selected;
        },
        set(value) {
          this.$store.state.ships.selected = value;
        },
      },

      selected() {
        let ship = JSON.parse(JSON.stringify(this.$store.state.ships.selected));

        if (!!ship) {
          ship.cargo = configs.getCargoType(ship.cargo).name;
        }

        return ship;
      },
    },

    watch: {
      // Watch for showPath changes
      showPath(value) {
        if (value) {
          this.$store.dispatch("ships/SET_SELECTED_PATH", this.selected.path);
        } else {
          this.$store.dispatch("ships/SET_SELECTED_PATH", null);
        }
      },
    },

    methods: {
      // Helper method to format date
      formatDate(date) {
        return date ? new Date(date).toLocaleString({ timeZone: "UTC" }) : "";
      },
    },
  };
</script>
<style>
  .flag {
    width: 25px;
    height: 25px;
  }
</style>
