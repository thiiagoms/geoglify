<script setup>
import { Head } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';

</script>

<template>

    <Head title="Create Layer" />

    <AuthenticatedLayout>
        <template #breadcrumbs>
            <v-breadcrumbs :items="[
                { title: 'Home', disabled: false, href: '/' },
                { title: 'Layer', disabled: false, href: route('layer.index') },
                { title: 'Create', disabled: true },
            ]" divider="/" />
        </template>

        <v-card class="max-w-7xl mx-auto pa-6" flat  title="Create Layer" subtitle="Create a new Layer">
            <v-card-text>
            </v-card-text>
        </v-card>
    </AuthenticatedLayout>

</template>