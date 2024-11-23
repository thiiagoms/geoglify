<template>
    <v-card flat>
        <v-card-title class="d-flex align-center pe-2">
            <v-icon icon="mdi-ferry" color="primary"></v-icon> &nbsp; Ship
            Realtime Positions
            <v-spacer></v-spacer>
            <v-text-field
                v-model="search"
                density="compact"
                label="Search"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                flat
                hide-details
                @input="handleInput"
            ></v-text-field>
        </v-card-title>

        <v-divider></v-divider>

        <v-data-table-server
            :search="search"
            :headers="headers"
            :items="paginatedItems"
            :items-length="totalItems"
            :loading="loading"
            v-model:items-per-page="itemsPerPage"
            @update:options="loadItems"
            @update:items="emitFilteredShips"
            item-value="mmsi"
            density="compact"
        >
            <template v-slot:loading>
                <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
            </template>

            <!-- Photo -->
            <template v-slot:item.photo="{ item }">
                <v-avatar
                    rounded="0"
                    class="ma-1"
                    color="#ccc"
                    style="width: 100px"
                >
                    <v-img
                        :width="100"
                        aspect-ratio="9/16"
                        cover
                        v-if="!!item.id"
                        :src="`/api/ships/${item.id}/photo`"
                    />
                </v-avatar>
            </template>

            <!-- Name -->
            <template v-slot:item.name="{ item }">
                <b v-html="item.name"></b>
            </template>

            <!-- MMSI -->
            <template v-slot:item.mmsi="{ item }">
                <span v-html="item.mmsi"></span>
            </template>

            <!-- IMO -->
            <template v-slot:item.imo="{ item }">
                <span v-html="item.imo"></span>
            </template>

            <!-- Callsign -->
            <template v-slot:item.callsign="{ item }">
                <span v-html="item.callsign"></span>
            </template>

            <!-- Vessel Type -->
            <template v-slot:item.cargo_name="{ item }">
                <span v-html="item.cargo_name"></span>
            </template>

            <!-- Country -->
            <template v-slot:item.country="{ item }">
                <country-flag
                    v-if="item.country_iso_code"
                    :country="item.country_iso_code"
                    class="flag"
                    left
                />
                <span v-html="item.country_name"></span>
            </template>

            <!-- Destination -->
            <template v-slot:item.destination="{ item }">
                <span v-html="item.destination"></span>
            </template>

            <!-- ETA -->
            <template v-slot:item.eta="{ item }">
                {{ formatDateTime(item.eta) }}
            </template>

            <!-- Last Updated -->
            <template v-slot:item.last_updated="{ item }">
                {{ formatDateTime(item.last_updated) }}
            </template>
        </v-data-table-server>
    </v-card>
</template>

<script>
export default {
    props: ["ships"],
    data() {
        return {
            itemsPerPage: 5,
            serverItems: [],
            paginatedItems: [],
            loading: false,
            totalItems: 0,
            search: "",
            headers: [
                { title: "", value: "photo", width: "100px" },
                { title: "Name", value: "name" },
                { title: "MMSI", value: "mmsi", width: "150px" },
                { title: "IMO", value: "imo", width: "150px" },
                { title: "Callsign", value: "callsign", width: "150px" },
                { title: "Vessel Type", value: "cargo_name" },
                { title: "Country", value: "country" },
                { title: "Destination", value: "destination" },
                { title: "ETA", value: "eta" },
                { title: "Last Updated", value: "last_updated" },
            ],
            debounceTimer: null, // Timer para debounce
        };
    },
    methods: {
        handleInput() {
            // Limpa o timer anterior
            clearTimeout(this.debounceTimer);

            // Define um novo timer
            this.debounceTimer = setTimeout(() => {
                this.emitFilteredShips();
            }, 300); // 300 ms de atraso
        },

        loadItems({ page, itemsPerPage, search }) {
            this.loading = true;
            fetch("/api/ships/realtime/search", {
                method: "post",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ page, itemsPerPage, search }),
            })
                .then((response) => response.json())
                .then((data) => {
                    this.paginatedItems = data.paginated_items;
                    this.serverItems = data.filtered_items;
                    this.totalItems = data.total;
                    this.emitFilteredShips();
                })
                .catch(() => {
                    this.paginatedItems = [];
                    this.serverItems = [];
                    this.totalItems = 0;
                })
                .finally(() => {
                    this.loading = false;
                });
        },

        emitFilteredShips() {
            this.$emit("filtered-ships", this.serverItems);
        },
    },
};
</script>
<style>
table tbody * {
    font-family: "Roboto Mono", monospace !important;
}

table {
    width: 100%;
    border-collapse: collapse;
    text-transform: uppercase;
    font-size: 14px;
}

table thead th {
    background-color: #d13e41 !important;
    color: white;
    font-weight: bolder !important;
}

.v-table__wrapper thead {
    position: sticky;
    top: 0;
    z-index: 1;
    background-color: white;
}

.v-data-table-footer__items-per-page {
    display: none;
}

.flag {
    margin-top: -8px !important;
    border-radius: 5px !important;
    margin-right: -5px !important;
    float: left !important;
}

em {
    font-style: normal !important;
    background-color: yellow !important;
}
</style>
