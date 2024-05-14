<template>
  <v-dialog v-model="dialogVisible" max-width="800px" persistent scrollable>
    <v-card>
      <v-card-title class="font-weight-bold">Edit Layer</v-card-title>

      <v-divider></v-divider>

      <v-card-text>
        <v-form ref="form">
          <v-text-field v-model="updatedLayer.name" label="Name" placeholder="Enter Name" variant="outlined" :rules="nameRules" required class="mb-2"></v-text-field>

          <v-textarea v-model="updatedLayer.description" label="Description" placeholder="Enter Description" variant="outlined" :rules="descriptionRules" required rows="2" class="mb-2"></v-textarea>

          <v-select v-model="updatedLayer.type" :items="layerTypes" label="Type" placeholder="Select Type" required variant="outlined" :rules="typeRules" class="mb-2" readonly disabled></v-select>

          <v-text-field v-model="updatedLayer.datasource" label="Datasource" placeholder="Enter Datasource" variant="outlined" class="mb-2"></v-text-field>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="closeDialog" :disabled="loading">Cancel</v-btn>
        <v-btn text @click="saveLayer" :loading="loading" :disabled="loading">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
  export default {
    props: ["open", "layerData"],
    data() {
      return {
        loading: false,
        dialogVisible: false,
        menu: false,
        updatedLayer: {
          name: null,
          description: null,
          type: null,
          datasource: null,
          style: null,
        },
        nameRules: [
          (value) => !!value || "Name is required",
          (value) => {
            if (value?.length < 30) return true;
            return "Name must be less than 30 characters.";
          },
        ],
        descriptionRules: [
          (value) => !!value || "Description is required",
          (value) => {
            if (value?.length < 100) return true;
            return "Description must be less than 100 characters.";
          },
        ],
        typeRules: [(value) => !!value || "Type is required"],
        layerTypes: [
          { title: "Point", value: "point" },
          { title: "Line", value: "line" },
          { title: "Polygon", value: "polygon" },
        ],
      };
    },
    watch: {
      open(value) {
        this.dialogVisible = value;
        if (value && this.layerData) {
          this.loadLayerData(this.layerData);
        }
      },
      dialogVisible(value) {
        this.$emit("update:open", value);
      },
    },
    methods: {
      async loadLayerData(data) {
        this.updatedLayer = { ...data };
      },
      async saveLayer() {
        // Set the loading state
        this.loading = true;

        // Set the loading state
        const { valid } = await this.$refs.form.validate();

        // Validate the form
        if (valid) {
          // Update the layer
          await this.$store.dispatch("layers/UPDATE", { layerId: this.updatedLayer.id, data: this.updatedLayer });

          // Reset the loading state
          this.loading = false;

          // Reset the loading state
          this.closeDialog();
        } else {
          this.loading = false;
        }
      },
      closeDialog() {
        this.dialogVisible = false;
      },
    },
  };
</script>
