<template>
  <v-dialog v-model="confirmDelete" max-width="500px">
    <v-card>
      <v-card-title class="font-weight-bold py-4">Delete Layer</v-card-title>

      <v-divider></v-divider>

      <v-card-text>Are you sure you want to delete this layer?</v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="cancelDelete" :disabled="loading">Cancel</v-btn>
        <v-btn color="error" @click="deleteLayer" :loading="loading" :disabled="loading">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
  export default {
    props: ["open", "layerId"],
    data: () => ({
      confirmDelete: false,
      loading: false,
    }),
    watch: {
      open(val) {
        if (val) this.confirmDelete = true; // Display confirmation dialog when opening the component
      },
      confirmDelete(val) {
        this.$emit("update:open", false); // Close the component when the confirmation dialog is closed
      },
    },
    methods: {
      async deleteLayer() {

        // Set the loading state
        this.loading = true;

        // Delete the layer
        await this.$store.dispatch("layers/DELETE", { layerId: this.layerId });

        // Reset the loading state
        this.loading = false;
        
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
