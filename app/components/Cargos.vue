<template>
  <v-toolbar
    dark
    class="fixed-bar"
    v-if="cargosStoreInstance.isNavigationDrawerOpen"
  >
    <v-toolbar-title>
      <v-list-item class="px-0">
        <v-list-item-title class="text-h6 font-weight-black">
          Ship Types</v-list-item-title
        >
      </v-list-item>
    </v-toolbar-title>

    <v-spacer></v-spacer>
    <v-btn
      icon
      @click="cargosStoreInstance.setNavigationDrawerState(false)"
      density="compact"
    >
      <v-icon>mdi-close</v-icon>
    </v-btn>
  </v-toolbar>

  <div>
    <!-- Virtual scroll for cargos list -->
    <v-virtual-scroll
      :items="filteredCategories"
      item-height="20"
      style="height: calc(100vh - 135px)"
    >
      <template v-slot:default="{ item }">
        <!-- List item for each cargo -->
        <v-list-item class="cargo-item pt-1 pb-0 pl-1 pr-3">
          <template v-slot:prepend="{ isActive }">
            <v-list-item-action>
              <v-checkbox-btn
                v-model="item.isActive"
                @change="handleCategoriesCheckboxChange(item)"
              ></v-checkbox-btn> </v-list-item-action
          ></template>
          <!-- Cargo name -->
          <v-list-item-title class="font-weight-bold">{{
            item.name
          }}</v-list-item-title>

          <!-- Flag image in the prepend slot -->
          <template v-slot:append>
            <v-icon :color="item.color">mdi-label</v-icon>
          </template>
        </v-list-item>
      </template>
    </v-virtual-scroll>
  </div>
</template>

<script>
export default {
  setup() {
    const cargosStoreInstance = cargosStore();
    const shipsStoreInstance = shipsStore();
    return { cargosStoreInstance, shipsStoreInstance };
  },

  computed: {
    filteredCategories() {
      return [...this.cargosStoreInstance.filteredList.values()].sort(
        (cargo1, cargo2) => {
          if (cargo1.priority > cargo2.priority) {
            return -1;
          } else if (cargo1.priority < cargo2.priority) {
            return 1;
          } else {
            return cargo1.name
              .toLowerCase()
              .localeCompare(cargo2.name.toLowerCase());
          }
        }
      );
    },
  },

  methods: {
    handleCategoriesCheckboxChange(item) {
      for (let index = 0; index < item.cargos.length; index++) {
        const element = item.cargos[index];
        this.shipsStoreInstance.updateCargoActiveState(element, item.isActive);
      }
    },
  },
};
</script>

<style scoped>
.cargo-item {
  border-bottom: 1px solid #e0e0e0;
}
</style>
