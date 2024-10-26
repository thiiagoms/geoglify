<template>
    <v-card flat>
        <v-card-title class="d-flex align-center pe-2 bg-primary">
            <country-flag
                :country="getCountryFlag(ship.mmsi)"
                class="flag"
                left
            />
            {{ ship.mmsi }}
        </v-card-title>

        <v-card-text class="ma-0 pa-0">
            <v-table>
                <tbody>
                    <tr>
                        <td class="font-weight-black">MMSI</td>
                        <td>{{ ship.mmsi }}</td>
                    </tr>
                    <tr>
                        <td class="font-weight-black">IMO</td>
                        <td>{{ ship.imo }}</td>
                    </tr>
                    <tr>
                        <td class="font-weight-black">Name</td>
                        <td>{{ ship.name }}</td>
                    </tr>
                    <tr>
                        <td class="font-weight-black">Call Sign</td>
                        <td>{{ ship.callsign }}</td>
                    </tr>
                    <tr>
                        <td class="font-weight-black">Country</td>
                        <td>
                            {{ getCountryName(ship.mmsi) }}
                        </td>
                    </tr>
                    <tr>
                        <td class="font-weight-black">Vessel Type</td>
                        <td>{{ getCargoName(ship.cargo) }}</td>
                    </tr>
                    <tr>
                        <td class="font-weight-black">ETA</td>
                        <td>
                            {{
                                ship.eta
                                    ? new Date(ship.eta).toLocaleString()
                                    : ""
                            }}
                        </td>
                    </tr>
                    <tr>
                        <td class="font-weight-black">Destination</td>
                        <td>{{ ship.destination }}</td>
                    </tr>
                    <tr>
                        <td class="font-weight-black">Latitude</td>
                        <td>{{ ship.lat }}</td>
                    </tr>
                    <tr>
                        <td class="font-weight-black">Longitude</td>
                        <td>{{ ship.lon }}</td>
                    </tr>
                    <tr>
                        <td class="font-weight-black">Speed Over Ground</td>
                        <td>{{ ship.sog }}</td>
                    </tr>
                    <tr>
                        <td class="font-weight-black">Course Over Ground</td>
                        <td>{{ ship.cog }}</td>
                    </tr>
                    <tr>
                        <td class="font-weight-black">Heading</td>
                        <td>{{ ship.heading }}</td>
                    </tr>

                    <tr>
                        <td class="font-weight-black">Last Updated</td>
                        <td>
                            {{
                                ship.last_updated
                                    ? new Date(
                                          ship.last_updated
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
import mids from "@/../data/mids.json";
import cargos from "@/../data/cargos.json";

export default {
    props: ["ship"], // Receives ship from the map component
    data() {
        return {
            loading: false,
            details: {},
        };
    },

    mounted() {
        this.fetchShipDetails();
    },

    methods: {
        fetchShipDetails() {
            this.loading = true;
            fetch(`/ship-realtime-positions/details/${this.ship.mmsi}`, {
                method: "get",
                headers: { "Content-Type": "application/json" },
            })
                .then((response) => response.json())
                .then((data) => {
                    this.details = data.ship; // Atualiza os dados do navio
                })
                .catch(() => {
                    this.details = {}; // Limpa os dados do navio em caso de erro
                })
                .finally(() => {
                    this.loading = false; // Termina o estado de carregamento
                });
        },

        getCountryFlag(mmsi) {
            const mid = mmsi.toString().slice(0, 3);
            const country = mids[mid];
            return country ? country[0] : "";
        },

        getCountryName(mmsi) {
            const mid = mmsi.toString().slice(0, 3);
            const country = mids[mid];
            return country ? country[3] : "";
        },

        getCargoName(code) {
            const cargo = cargos[code];
            return cargo ? cargo[0] : "";
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
