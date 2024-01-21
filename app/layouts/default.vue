<template>
  <v-layout class="rounded rounded-md">
    <!-- Top app bar with app title and navigation button -->
    <v-app-bar color="white" density="compact">
      <v-app-bar-title><span class="title">GEOGLIFY</span></v-app-bar-title>

      <!-- Navigation button to toggle the right sidebar -->
      <template v-slot:append>
        <v-app-bar-nav-icon @click.stop="isNavigationDrawerOpen = !isNavigationDrawerOpen"></v-app-bar-nav-icon>
      </template>
    </v-app-bar>

    <!-- Right sidebar for navigation with Ships component -->
    <v-navigation-drawer
      v-model="isNavigationDrawerOpen"
      location="right"
      :width="400"
      :absolute="true"
    >
      <Ships></Ships>
      <!-- Include the Ships component -->
    </v-navigation-drawer>

    <!-- Main content area with a slot for dynamic content -->
    <v-main class="main-content">
      <slot />
      <!-- dynamic content -->
    </v-main>

    <div class="content"><Ship></Ship></div>
  </v-layout>
</template>

<script>
export default {
  data() {
    return {
      isNavigationDrawerOpen: false,
    };
  },
};
</script>

<style scoped>
.main-content {
  height: 100vh;
}
</style>