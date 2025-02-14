<template>
    <Head title="Dashboard" />

    <DashboardLayout>
        <template #breadcrumbs>
            <v-breadcrumbs
                :items="[
                    { title: 'Home', disabled: false, href: '/' },
                    { title: 'Dashboard', disabled: true },
                ]"
                divider="/"
            />
        </template>

        <Map
            :ships="ships"
            :ship="ship"
            :realtimePosition="realtimePosition"
        ></Map>
    </DashboardLayout>
</template>

<script>
import Map from "@/Components/Map.vue";
import DashboardLayout from "@/Layouts/DashboardLayout.vue";
import { Head } from "@inertiajs/vue3";

export default {
    components: {
        Map,
        DashboardLayout,
        Head,
    },
    props: {
        ships: Array,
        ship: Object,
        realtimePosition: Object,
    },
};
</script>

<style>
html,
body {
    height: 100%;
    overflow: hidden;
    margin: 0;
    padding: 0;
}
</style>
