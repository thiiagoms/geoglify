<template>
    <v-card flat>
        <v-card-title class="d-flex align-center pe-2 bg-primary">
            <country-flag
                :country="data.country_iso_code ?? 'XX'"
                class="flag"
                left
            />
            {{ ship.mmsi }}
        </v-card-title>

        <v-card-text class="ma-0 pa-0" v-if="!this.loading">
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
                        <td>
                            {{ data.country_name }}
                        </td>
                    </tr>
                    <tr>
                        <td class="font-weight-black">Vessel Type</td>
                        <td>{{ data.cargo_name }}</td>
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
                    <tr>
                        <td class="font-weight-black">Destination</td>
                        <td>{{ data.destination }}</td>
                    </tr>
                    <tr>
                        <td class="font-weight-black">Latitude</td>
                        <td>{{ data.lat }}</td>
                    </tr>
                    <tr>
                        <td class="font-weight-black">Longitude</td>
                        <td>{{ data.lon }}</td>
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
                </tbody>
            </v-table>
        </v-card-text>
    </v-card>
</template>

<script>

export default {
    props: ["ship"], // Receives ship from the map component
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
