<template>
  <v-card class="pa-0" flat v-if="shipDetails">
    <!-- Toolbar with ship name and flag -->
    <v-toolbar color="white" dark>
      <v-toolbar-title class="font-weight-black text-h6">
        <v-list density="compact">
          <v-list-item class="pa-2 ma-0">
            <template v-slot:prepend>
              <!-- Display ship flag -->
              <v-avatar size="30">
                <v-img
                  :src="`https://hatscripts.github.io/circle-flags/flags/${(
                    shipDetails?.countrycode || 'xx'
                  ).toLowerCase()}.svg`"
                ></v-img>
              </v-avatar>
            </template>
            <!-- Display ship name and MMSI -->
            <v-list-item-title class="font-weight-black">
              {{ shipDetails?.mmsi ?? "N/A" }}
            </v-list-item-title>
            <v-list-item-subtitle>{{
              shipDetails?.shipname ?? "N/A"
            }}</v-list-item-subtitle>
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
          'https://photos.marinetraffic.com/ais/showphoto.aspx?mmsi=' +
          shipDetails.mmsi
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
          <template v-for="(value, label) in shipDetails">
            <template
              v-if="value !== null && value !== undefined && value !== '' && label != '_id' && label != 'countrycode'"
            >
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
  </v-card>
</template>

<script>
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
    shipDetails: {
      get() {
        return this.shipsStoreInstance?.selectedShipDetails;
      },
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