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

      <v-tabs v-model="tab" bg-color="primary">
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
                <v-timeline-item size="x-small" fill-dot :dot-color="getSpeedColor(feature.properties.sog)"
                  v-for="feature in selected.path.features.filter(f => !!f.properties.updated_at)">

                  <template v-slot:opposite>
                    <h3 class="headline font-weight-black">
                      {{ this.formatDate(feature.properties.updated_at) }}
                    </h3>
                    <v-btn variant="tonal" size="small" block @click="flyTo(feature.geometry.coordinates)">
                      <v-icon>mdi-target</v-icon>
                    </v-btn>
                  </template>
                  <v-alert width="180px" :color="getSpeedColorHex(feature.properties.sog)" border="top"
                    variant="outlined">
                    <div class="text-caption text-black">
                      <strong>HDG: </strong>{{ feature.properties?.hdg || "N/A" }}°
                    </div>
                    <div class="text-caption text-black">
                      <strong>COG: </strong> {{ feature.properties?.cog || "N/A" }}°
                    </div>
                    <div class="text-caption text-black">
                      <strong>SOG: </strong> {{ feature.properties?.sog || "N/A" }} knots
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
  props: ["map"],
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

  watch: {
    dialogOpened(value) {
      if (!value) {
        if (this.map.getSource('points')) {
          this.map.removeLayer('points');
          this.map.removeSource('points');
        }
      }
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

    getSpeedColor(sog) {
      const maxSpeed = 18; // Maximum relevant speed
      const clampedSpeed = Math.min(Math.max(sog, 0), maxSpeed); // Clamp the speed between 0 and 20

      const red = Math.min(255, Math.round((clampedSpeed / maxSpeed) * 255)); // Calculate the red component
      const green = Math.min(255, Math.round(255 - (clampedSpeed / maxSpeed) * 255)); // Calculate the green component
      const blue = 0; // Blue component is always 0

      //hex color
      return `#${red.toString(16).padStart(2, "0")}${green.toString(16).padStart(2, "0")}${blue.toString(16).padStart(2, "0")}`;
    },

    getSpeedColorHex(sog) {
      const maxSpeed = 18; // Maximum relevant speed
      const clampedSpeed = Math.min(Math.max(sog, 0), maxSpeed); // Clamp the speed between 0 and 20

      const red = Math.min(255, Math.round((clampedSpeed / maxSpeed) * 255)); // Calculate the red component
      const green = Math.min(255, Math.round(255 - (clampedSpeed / maxSpeed) * 255)); // Calculate the green component
      const blue = 0; // Blue component is always 0

      //hex color
      return `#${red.toString(16).padStart(2, "0")}${green.toString(16).padStart(2, "0")}${blue.toString(16).padStart(2, "0")}`;
    },

    flyTo(coordinates) {

      this.map.flyTo({
        center: coordinates,
        zoom: 13,
        essential: true,
      });

      if (this.map.getSource('points')) {
        this.map.removeLayer('points');
        this.map.removeSource('points');
      }

      this.map.addSource('points', {
        'type': 'geojson',
        'data': {
          'type': 'FeatureCollection',
          'features': [
            {
              'type': 'Feature',
              'geometry': {
                'type': 'Point',
                'coordinates': coordinates
              }
            }
          ]
        }
      });

      this.map.addLayer({
        'id': 'points',
        'source': 'points',
        'type': 'circle',
        'paint': {
          'circle-radius': 10,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF',
          'circle-opacity': 0.7,
          'circle-color': '#FFFFFF'
        }
      });

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