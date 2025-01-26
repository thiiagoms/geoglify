<script>
import ShipSearch from "@/Components/ShipSearch.vue";

export default {
    components: {
        ShipSearch,
    },
};
</script>
<template>
    <v-app>
        <v-app-bar elevation="0" color="primary">
            <v-app-bar-title class="font-weight-bold text-h5"
                >Geoglify</v-app-bar-title
            >

            <template #append>
                <ShipSearch class="mr-2" />
            </template>
        </v-app-bar>

        <v-main>
            <v-container class="pa-0 map-container">
                <slot />
            </v-container>
        </v-main>
    </v-app>
</template>

<style>
.map-container {
    max-width: 100% !important;
    height: 100% !important;
}
</style>
