<template>
    <v-card flat>
        <!-- Fixed title at the top -->
        <v-card-title class="d-flex align-center pe-2 bg-primary sticky-title">
            <country-flag
                :country="data.country_iso_code ?? 'XX'"
                class="flag"
                left
            />
            {{ ship.mmsi }}
            <v-spacer></v-spacer>
            <v-btn icon variant="tonal" size="small" @click="$emit('close')">
                <v-icon>mdi-close</v-icon>
            </v-btn>
        </v-card-title>

        <!-- Scrollable content -->
        <v-card-text class="scrollable-content" v-if="!this.loading">
            <v-avatar
                rounded="0"
                class="ma-0"
                color="#ccc"
                style="width: 100%; height: 200px"
            >
                <v-img
                    cover
                    v-if="!!data.id"
                    :src="`/api/ships/${data.id}/photo`"
                />
            </v-avatar>

            <v-table>
                <tbody>
                    <tr>
                        <td class="font-weight-black">MMSI</td>
                        <td>{{ data.mmsi }}</td>
                    </tr>
                    <tr>
                        <td class="font-weight-black">IMO</td>
                        <td>{{ data.imo }}</td>
                    </tr>
                    <tr>
                        <td class="font-weight-black">Name</td>
                        <td>{{ data.name }}</td>
                    </tr>
                    <tr>
                        <td class="font-weight-black">Call Sign</td>
                        <td>{{ data.callsign }}</td>
                    </tr>
                    <tr>
                        <td class="font-weight-black">Country</td>
                        <td>{{ data.country_name }}</td>
                    </tr>
                    <tr>
                        <td class="font-weight-black">Vessel Type</td>
                        <td>{{ data.cargo_name }}</td>
                    </tr>
                    <tr>
                        <td class="font-weight-black">Destination</td>
                        <td>{{ data.destination }}</td>
                    </tr>
                    <tr>
                        <td class="font-weight-black">Speed Over Ground</td>
                        <td>{{ data.sog }}</td>
                    </tr>
                    <tr>
                        <td class="font-weight-black">Course Over Ground</td>
                        <td>{{ data.cog }}</td>
                    </tr>
                    <tr>
                        <td class="font-weight-black">Heading</td>
                        <td>{{ data.hdg }}</td>
                    </tr>
                    <tr>
                        <td class="font-weight-black">Last Updated</td>
                        <td>
                            {{
                                data.last_updated
                                    ? new Date(
                                          data.last_updated
                                      ).toLocaleString()
                                    : ""
                            }}
                        </td>
                    </tr>
                    <tr class="bg-secondary">
                        <td class="font-weight-black">ETA</td>
                        <td>
                            {{
                                data.eta
                                    ? new Date(data.eta).toLocaleString()
                                    : ""
                            }}
                        </td>
                    </tr>
                    <tr class="bg-primary">
                        <td class="font-weight-black">Distance Planned (NM)</td>
                        <td>{{ data?.routes?.planned.distance_nm }}</td>
                    </tr>
                    <tr class="bg-primary">
                        <td class="font-weight-black">Predicted ETA</td>
                        <td>
                            {{
                                data.predicted_eta
                                    ? new Date(
                                          data.predicted_eta
                                      ).toLocaleString()
                                    : ""
                            }}
                        </td>
                    </tr>
                </tbody>
            </v-table>
        </v-card-text>
    </v-card>
</template>

<script>
export default {
    props: ["ship"],
    data() {
        return {
            loading: false,
            data: {},
        };
    },

    mounted() {
        this.fetchShipDetails();
    },

    methods: {
        fetchShipDetails() {
            this.loading = true;
            fetch(`/api/ships/details/${this.ship.mmsi}`, {
                method: "get",
                headers: { "Content-Type": "application/json" },
            })
                .then((response) => response.json())
                .then((data) => {
                    this.data = data; // Sets the ship details
                    this.$emit("ship-details-fetched", {
                        plannedGeojson: data.routes.planned.geojson,
                        realGeojson: data.routes.real.geojson,
                    });
                })
                .catch(() => {
                    this.data = {}; // Resets the ship details
                })
                .finally(() => {
                    this.loading = false; // Hides the loading spinner
                });
        },
    },
};
</script>

<style scoped>
.scrollable-content {
    max-height: calc(100vh - 140px);
    overflow-y: auto;
    padding: 2px;
}

.sticky-title {
    position: sticky;
    top: 0;
    z-index: 1;
    color: white;
}

table tbody * {
    font-family: "Roboto Mono", monospace !important;
}

.flag {
    border: 1px solid #fff !important;
    margin-top: -12px !important;
    border-radius: 5px !important;
    margin-right: -5px !important;
    float: left !important;
}
</style>
