<template>
  <v-dialog v-model="confirmDelete" max-width="500px">
    <v-card>

      <v-card-title class="font-weight-black py-5">CONFIRM DELETION</v-card-title>
      <v-divider></v-divider>

      <v-card-text>Are you sure you want to delete this wms?</v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="cancelDelete">Cancel</v-btn>
        <v-btn color="error" @click="deleteLayer">Confirm</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    open: Boolean,
    layerId: String,
  },
  data: () => ({
    confirmDelete: false,
  }),
  watch: {
    open(val) {
      if (val) this.confirmDelete = true; // Display confirmation dialog when opening the component
    },
    confirmDelete(val) {
      this.$emit("update:open", false); // Close the component when the confirmation dialog is closed
    },
  },
  setup() {
    const wmsLayersStoreInstance = wmsLayersStore();
    return { wmsLayersStoreInstance };
  },
  methods: {
    async deleteLayer() {
      // Call store method to delete the layer
      await this.wmsLayersStoreInstance.deleteLayer(this.layerId);
      // Close the confirmation dialog
      this.confirmDelete = false;
    },
    cancelDelete() {
      // Close the confirmation dialog without deleting the layer
      this.confirmDelete = false;
    },
  },
};
</script>
