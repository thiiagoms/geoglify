<template>
  <v-card class="pa-0" flat v-if="shipDetails">
    <!-- Toolbar with ship name and flag -->
    <v-toolbar color="white" dark>
      <v-toolbar-title class="font-weight-black text-h6">
        <v-list density="compact">
          <v-list-item class="pa-0 ma-0">
            <template v-slot:prepend>
              <!-- Display ship flag -->
              <v-avatar size="30">
                <v-img
                  :src="`https://hatscripts.github.io/circle-flags/flags/${(
                    this.shipsStoreInstance?.selectedShip?.flag_country_code || 'xx'
                  ).toLowerCase()}.svg`"
                ></v-img>
              </v-avatar>
            </template>
            <!-- Display ship name and MMSI -->
            <v-list-item-title class="font-weight-black">
              {{ shipDetails?.Name }}
            </v-list-item-title>
            <v-list-item-subtitle>{{ shipDetails?.MMSI }}</v-list-item-subtitle>
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
      <!-- Display ship icon -->
      <v-img
        :src="
          'https://photos.marinetraffic.com/ais/showphoto.aspx?imo=' +
          shipDetails.IMO
        "
      >
        <template v-slot:error>
          <v-img
            class="mx-auto"
            src="https://placehold.co/600x400?text=No+Photo"
          ></v-img> </template
      ></v-img>
      <!-- Table for displaying ship information -->
      <v-table density="compact">
        <tbody>
          <!-- Use v-for to loop through ship information -->
          <tr v-for="(value, label) in shipDetails" :key="label">
            <!-- Display label in bold -->
            <td class="font-weight-bold">{{ label }}</td>
            <!-- Conditionally format and display ship information -->
            <td v-if="label === 'ETA'">{{ formatDate(value) || 'N/A' }}</td>
            <td v-else-if="label === 'LOA' || label === 'LBP' || label === 'Deadweight' || label === 'Breadth Moulded' || label === 'Hull Beam' || label === 'GT' || label === 'NT' || label === 'Maximum Draught'">{{ formatWithUnit(value, label) || 'N/A' }}</td>
            <td v-else>{{ value || 'N/A' }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<script>
// Import the shipsStore
import { shipsStore } from "~/stores/shipsStore";

export default {
  setup() {
    // Use shipsStore to get ship data
    const shipsStoreInstance = shipsStore();
    return { shipsStoreInstance };
  },

  computed: {
    // Computed property for dialog state
    dialogOpened: {
      get() {
        return !!this.shipsStoreInstance?.selectedShip;
      },
      set(value) {
        this.shipsStoreInstance.selectedShip = value;
      },
    },

    // Computed property for selected ship details
    shipDetails() {
      const selectedShip = this.shipsStoreInstance?.selectedShip;
      return selectedShip
        ? {
            MMSI: selectedShip.mmsi,
            IMO: selectedShip.imo,
            Name: selectedShip.name,
            LOA: selectedShip.loa,
            LBP: selectedShip.lbp,
            Deadweight: selectedShip.deadweight,
            "Breadth Moulded": selectedShip.breadth_moulded,
            "Hull Beam": selectedShip.hull_beam,
            GT: selectedShip.gt,
            NT: selectedShip.nt,
            "Call Sign": selectedShip.call_sign,
            "Construction Date": selectedShip.construction_date,
            "Maximum Draught": selectedShip.maximum_draught,
            "Ship Type": selectedShip.ship_type_description,
            "Registry Country": selectedShip.registry_country_name,
            "Flag Country": selectedShip.flag_country_name,
            "Ship Group": selectedShip.ship_group_description,
            "Ship Owner": selectedShip.ship_owner_name,
            "Management Company": selectedShip.management_company_name,
            "ETA": selectedShip.eta,
            "Latest Report": selectedShip.time_utc,
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

    // Helper method to get SI units based on label and format with the unit
    formatWithUnit(value, label) {
      const units = {
        "LOA": " m",
        "LBP": " m",
        "Deadweight": " metric tons",
        "Breadth Moulded": " m",
        "Hull Beam": " m",
        "GT": " GT",
        "NT": " NT",
        "Maximum Draught": " m",
      };
      const unit = units[label] || "";
      return value + unit;
    },
  },
};
</script>
