<script setup>
import Dashboard from "@/Components/Dashboard.vue";
import DashboardLayout from "@/Layouts/DashboardLayout.vue";
import { Head } from "@inertiajs/vue3";
</script>

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

        <Dashboard></Dashboard>
    </DashboardLayout>
</template>
