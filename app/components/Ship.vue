<template>
  <!-- Dialog for displaying ship details -->
  <v-dialog v-model="opened" max-width="400px" theme="geoglify">
    <v-card class="pa-0">
      <v-card-title class="text-center font-weight-black">
        {{ shipInfo?.Name }}
      </v-card-title>
      <v-card-text class="results pa-0">
        <!-- Table for displaying ship information -->
        <v-table density="compact" theme="geoglify">
          <tbody>
            <!-- Use v-for to loop through ship information -->
            <tr v-for="(value, label) in shipInfo" :key="label">
              <td>{{ label }}</td>
              <td v-if="label === 'Country'">
                <!-- Display country flag using v-avatar and v-img -->
                <v-avatar size="30">
                  <v-img
                    :src="`https://hatscripts.github.io/circle-flags/flags/${(
                      value?.code || 'xx'
                    ).toLowerCase()}.svg`"
                  ></v-img>
                </v-avatar>
                {{ value ? value.name : "N/A" }}
              </td>
              <td v-else>
                <!-- Display other ship information -->
                {{
                  label === "ETA" || label === "Latest Report"
                    ? formatDate(value)
                    : value
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
