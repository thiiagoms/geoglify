<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import { Head } from '@inertiajs/vue3';

</script>

<template>

    <Head title="Edit Layer" />

    <AuthenticatedLayout>
        <template #breadcrumbs>
            <v-breadcrumbs :items="[
                { title: 'Home', disabled: false, href: '/' },
                { title: 'Layers', disabled: false, href: route('layers.index') },
                { title: 'Edit', disabled: true },
            ]" divider="/" />
        </template>

        <v-card class="max-w-7xl mx-auto pa-6" flat  title="Edit Layer" subtitle="Edit layer details">
            <v-card-text>
               
            </v-card-text>
        </v-card>
    </AuthenticatedLayout>
</template>