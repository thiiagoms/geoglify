<template>
    <v-navigation-drawer width="400" v-model="open" location="right" permanent>
        <v-card flat class="rounded-0">
            <!-- Fixed title at the top -->
            <v-card-title
                class="d-flex align-center pe-2 bg-secondary sticky-title"
            >
                <country-flag
                    :country="this.loading ? 'XX' : data.country_iso_code ?? 'XX'"
                    class="flag"
                    left
                />
                {{ data.mmsi }}
                <v-spacer></v-spacer>
                <v-btn icon variant="tonal" size="small" @click="close">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>

            <!-- Scrollable content -->
            <v-card-text class="scrollable-content">
                <v-skeleton-loader
                    class="mx-auto"
                    type="image, article"
                    v-if="this.loading"
                ></v-skeleton-loader>

                <v-avatar
                    rounded="0"
                    class="ma-0"
                    color="#ccc"
                    style="width: 100%; height: 200px"
                    v-if="!this.loading"
                >
                    <v-img
                        cover
                        v-if="!!data.id"
                        :src="`/api/ships/${data.id}/photo`"
                    />
                </v-avatar>

                <v-table v-if="!this.loading">
                    <tbody class="details-table">
                        <tr>
                            <td class="font-weight-black">Name</td>
                            <td>{{ data.name }}</td>
                        </tr>
                        <tr>
                            <td class="font-weight-black">MMSI</td>
                            <td>{{ data.mmsi }}</td>
                        </tr>
                        <tr>
                            <td class="font-weight-black">IMO</td>
                            <td>{{ data.imo }}</td>
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
                            <td class="font-weight-black">Cargo Type</td>
                            <td>{{ data.cargo_type_name }}</td>
                        </tr>
                        <tr>
                            <td class="font-weight-black">Cargo Category</td>
                            <td>{{ data.cargo_category_name }}</td>
                        </tr>
                        <tr>
                            <td class="font-weight-black">Length</td>
                            <td>{{ (data.dim_a + data.dim_b) / 2 }}m</td>
                        </tr>
                        <tr>
                            <td class="font-weight-black">Width</td>
                            <td>{{ (data.dim_c + data.dim_d) / 2 }}m</td>
                        </tr>
                        <tr>
                            <td class="font-weight-black">Destination</td>
                            <td>{{ data.destination }}</td>
                        </tr>
                        <tr>
                            <td class="font-weight-black">Speed Over Ground</td>
                            <td>{{ data.sog }} knots</td>
                        </tr>
                        <tr>
                            <td class="font-weight-black">
                                Course Over Ground
                            </td>
                            <td>{{ data.cog }} degrees</td>
                        </tr>
                        <tr>
                            <td class="font-weight-black">Heading</td>
                            <td>{{ data.hdg }} degrees</td>
                        </tr>

                        <tr>
                            <td class="font-weight-black">ETA</td>
                            <td>
                                {{
                                    data.eta
                                        ? new Date(data.eta).toLocaleString()
                                        : ""
                                }}
                            </td>
                        </tr>
                        <tr class="bg-primary" v-if="data.routes?.planned">
                            <td class="font-weight-black">
                                Distance Planned (NM)
                            </td>
                            <td>{{ data?.routes?.planned.distance_nm }}</td>
                        </tr>
                        <tr class="bg-primary" v-if="data.routes?.real">
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
                    </tbody>
                </v-table>
            </v-card-text>
        </v-card>
    </v-navigation-drawer>
</template>

<script>
export default {
    props: ["ship"],
    data() {
        return {
            open: false,
            loading: false,
            data: {},
        };
    },

    watch: {
        ship: {
            handler() {
                if (this.ship && this.ship.mmsi) this.fetchShipDetails();
            },
            immediate: true,
        },
    },

    methods: {
        fetchShipDetails() {
            this.open = true;
            this.loading = true;
            fetch(`/api/ships/details/${this.ship.mmsi}`, {
                method: "get",
                headers: { "Content-Type": "application/json" },
            })
                .then((response) => response.json())
                .then((data) => {
                    this.data = data; // Sets the ship details
                    this.open = true; // Opens the drawer
                })
                .catch(() => {
                    this.data = {}; // Resets the ship details
                    this.open = false; // Closes the drawer
                })
                .finally(() => {
                    this.loading = false; // Hides the loading spinner
                });
        },

        close() {
            // Close the drawer
            this.open = false;

            // Reset the selected ship in the Vuex store
            this.$store.commit("setSelectedShip", null);
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

table tbody td:first-child {
    width: 40%;
}

.flag {
    border: 1px solid #fff !important;
    margin-top: -12px !important;
    border-radius: 5px !important;
    margin-right: -5px !important;
    float: left !important;
}
</style>
