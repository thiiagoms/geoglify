<script>
import ShipSearch from "@/Components/ShipSearch.vue";

export default {
    components: {
        ShipSearch,
    },
    data() {
        return {
            menubar: false,
            menus: [
                {
                    title: "Dashboard",
                    icon: "mdi-view-dashboard",
                    href: route("dashboard"),
                    disabled: true,
                },
                {
                    title: "Layers",
                    icon: "mdi-layers",
                    href: route("layers.index"),
                    disabled: false, //!this.$page.props.auth.can.layers_index,
                },
                {
                    title: "Users",
                    icon: "mdi-account",
                    href: route("users.index"),
                    disabled: false, //!this.$page.props.auth.can.users_index,
                },
                {
                    title: "Roles",
                    icon: "mdi-account-group",
                    href: route("roles.index"),
                    disabled: false, //!this.$page.props.auth.can.roles_index,
                },
            ],
        };
    },
    methods: {
        logout() {
            this.$inertia.post(route("logout"));
        },
    },
};
</script>
<template>
    <v-app>
        <v-app-bar elevation="0" color="primary" density="comfortable">
            <v-app-bar-title class="font-weight-bold text-h5"
                >Geoglify</v-app-bar-title
            >

            <template #prepend>
                <v-app-bar-nav-icon
                    @click.stop="menubar = !menubar"
                ></v-app-bar-nav-icon>
            </template>

            <template #append>
                <ShipSearch class="mr-2"/>
            </template>
        </v-app-bar>

        <v-system-bar>
            <slot name="breadcrumbs" />
            <v-spacer></v-spacer>
        </v-system-bar>

        <v-navigation-drawer
            v-model="menubar"
            :location="$vuetify.display.mobile ? 'bottom' : undefined"
            color="secondary"
        >
            <v-list>
                <v-list>
                    <v-list-item
                        :subtitle="$page.props.auth.user.email"
                        :title="$page.props.auth.user.name"
                        :href="route('profile.edit')"
                    >
                        <template v-slot:prepend>
                            <v-icon color="white">mdi-account</v-icon>
                        </template>
                    </v-list-item>
                </v-list>

                <v-divider></v-divider>

                <v-list-item
                    v-for="menu in menus"
                    :key="menu.title"
                    link
                    :href="menu.href"
                    :title="menu.title"
                    :disabled="menu.disabled"
                >
                    <template v-slot:prepend>
                        <v-icon :icon="menu.icon" color="white"></v-icon>
                    </template>
                    <template v-slot:append>
                        <v-icon v-if="menu.disabled" color="white"
                            >mdi-lock</v-icon
                        >
                    </template>
                </v-list-item>

                <v-list-item link @click="logout" title="Logout">
                    <template v-slot:prepend>
                        <v-icon icon="mdi-logout" color="white"></v-icon>
                    </template>
                </v-list-item>
            </v-list>
        </v-navigation-drawer>

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
