<template>
  <v-navigation-drawer v-model="dialogOpened" :location="$vuetify.display.mobile ? 'bottom' : 'right'"
    style="z-index: 1003; right: 0px !important" permanent :width="$vuetify.display.mobile ? '100%' : '400'"
    v-if="selected">
    <v-card class="pa-0" flat>
      <!-- Toolbar with ship name and flag -->
      <v-toolbar color="white" dark>
        <v-toolbar-title class="font-weight-bold text-h6">
          <v-list density="compact">
            <v-list-item class="pa-2 ma-0">
              <template v-slot:prepend>
                <!-- Display ship flag -->
                <v-avatar size="30">
                  <component :is="'svgo-' + (selected?.countrycode || 'xx').toLowerCase()" filled class="flag">
                  </component>
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

      <v-tabs v-model="tab" bg-color="primary" align-tabs="center">
        <v-tab value="details">Details</v-tab>
        <v-tab value="timeline">Timeline</v-tab>
      </v-tabs>

      <v-card-text class="pa-0">
        <v-tabs-window v-model="tab">
          <v-tabs-window-item value="details">
            <v-card style="height: calc(100dvh - 200px); overflow: auto">
              <v-img :src="'https://photos.marinetraffic.com/ais/showphoto.aspx?mmsi=' + selected.mmsi">
                <template v-slot:error> <v-img class="mx-auto" src="https://placehold.co/600x400?text=No+Photo"></v-img>
                </template></v-img>
              <!-- Table for displaying ship information -->
              <v-table density="compact">
                <tbody>
                  <!-- Use v-for to loop through ship information -->
                  <template v-for="(value, label) in selected">
                    <template
                      v-if="value !== null && value !== undefined && value !== '' && label != '_id' && label != 'countrycode' && label != 'path'">
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
            </v-card>
          </v-tabs-window-item>

          <v-tabs-window-item value="timeline">
            <v-card style="height: calc(100dvh - 200px); overflow: auto;" class="px-5">
              <v-timeline side="end">
                <v-timeline-item dot-color="red" icon="mdi-compass"
                  v-for="feature in selected.path.features.filter(f => !!f.properties.updated_at).sort((a, b) => new Date(b.properties.updated_at) - new Date(a.properties.updated_at))">
                  <template v-slot:opposite>
                    <strong>{{ this.formatDate(feature.properties.updated_at) }}</strong>
                  </template>
                  <v-alert :value="true" density="compact" width="200px">
                    <div>
                      <div>
                        <div class="text-caption">
                          <strong>HDG: </strong>{{ feature.properties.hdg }}°
                        </div>
                        <div class="text-caption">
                          <strong>COG: </strong> {{ feature.properties.cog }}
                        </div>
                        <div class="text-caption">
                          <strong>SOG: </strong> {{ feature.properties.sog }}
                        </div>
                      </div>
                    </div>
                  </v-alert>
                </v-timeline-item>
              </v-timeline>
            </v-card>
          </v-tabs-window-item>

        </v-tabs-window>
      </v-card-text>

    </v-card>
  </v-navigation-drawer>
</template>

<script>
import configs from "~/helpers/configs";

export default {
  data: () => ({
    tab: null
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

    selectedTimeline: {
      get() {
        return this.$store.state.ships.selectedTimeline;
      },
      set(value) {
        this.$store.state.ships.selectedTimeline = value;
      },
    },
  },

  methods: {
    // Helper method to format date
    formatDate(date) {
      return date ? new Date(date).toLocaleString({ timeZone: "UTC" }).split(" ")[1] : "";
    },

    // Method to toggle selected timeline
    toggleSelectedTimeline(ship) {
      if (this.selectedTimeline === ship) {
        this.selectedTimeline = null;
      } else {
        this.selectedTimeline = ship;
      }
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