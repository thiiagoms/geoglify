<template>
  <!-- Dialog for displaying ship details -->
  <v-dialog v-model="opened" max-width="400px" v-if="shipInfo">
    <v-toolbar color="white" dark>
      <v-toolbar-title class="font-weight-black text-h6">
        <v-avatar size="30">
          <v-img
            :src="`https://hatscripts.github.io/circle-flags/flags/${(
              shipInfo?.country?.code || 'xx'
            ).toLowerCase()}.svg`"
          ></v-img>
        </v-avatar>
        {{ shipInfo?.Name }}
      </v-toolbar-title>
      <v-btn icon @click="opened = null">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>
    <v-card class="pa-0">
      <v-card-text class="results pa-0">
        <!-- Table for displaying ship information -->
        <v-table density="compact">
          <tbody>
            <!-- Use v-for to loop through ship information -->
            <tr v-for="(value, label) in shipInfo" :key="label">
              <td class="font-weight-bold">{{ label }}</td>
              <td>
                <!-- Display other ship information -->
                {{
                  label === "eta"
                    ? value ? new Date(value).toLocaleString("en-GB", { timeZone: "UTC" }) : "N/A" 
                    : value || "N/A"
                }}
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
// Import the shipsStore
import { shipsStore } from "~/stores/shipsStore";

export default {
  setup() {
    // Use shipsStore to get ship data
    const ships = shipsStore();
    return { ships };
  },

  computed: {
    opened: {
      get() {
        return !!this.ships?.selected;
      },
      set(value) {
        this.ships.selected = value;
      },
    },

    ship() {
      return this.ships?.selected;
    },

    shipInfo() {
      return this.ship
        ? {
            MMSI: this.ship.mmsi,
            IMO: this.ship.imo,
            "Call Sign": this.ship.calls_sign,
            Name: this.ship.ship_name,
            Type: this.ship.cargo_name,
            Country: this.ship.country,
            Destination: this.ship.destination,
            ETA: this.ship.eta ? this.formatDate(this.ship.eta) : "",
            "Latest Report": this.ship.time_utc
              ? this.formatDate(this.ship.time_utc)
              : "",
          }
        : null;
    },
  },

  methods: {
    // Helper method to format date
    formatDate(date) {
      return date
        ? new Date(date).toLocaleString("en-GB", { timeZone: "UTC" })
        : "";
    },
  },
};
</script>
