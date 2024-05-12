<template>
  <v-dialog v-model="dialogVisible" max-width="800px" persistent scrollable>
    <v-card>
      <v-toolbar class="fixed-bar" color="white" dark style="border-bottom: 1px solid #ccc">
        <v-toolbar-title class="text-h5 font-weight-black pl-4"> Create Layer </v-toolbar-title>

        <v-spacer></v-spacer>

        <v-btn icon @click="closeDialog" density="compact" class="ml-1">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-divider></v-divider>

      <v-card-text>
        <v-form ref="form">
          <v-text-field v-model="newLayer.code" label="Code" placeholder="Enter code" variant="outlined" :rules="codeRules" required class="mb-2"></v-text-field>

          <v-text-field v-model="newLayer.name" label="Name" placeholder="Enter Name" variant="outlined" :rules="nameRules" required class="mb-2"></v-text-field>

          <v-textarea v-model="newLayer.description" label="Description" placeholder="Enter Description" variant="outlined" :rules="descriptionRules" required rows="2" class="mb-2"></v-textarea>

          <v-select v-model="newLayer.type" :items="layerTypes" label="Type" placeholder="Select Type" required variant="outlined" :rules="typeRules" class="mb-2"></v-select>
        </v-form>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="saveLayer" :loading="loading" :disabled="loading">Create</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
  import configs from "~/helpers/configs";

  export default {
    props: ["open"],
    data() {
      return {
        loading: false,
        dialogVisible: false,
        menu: false,
        newLayer: {
          code: null,
          name: null,
          description: null,
          type: null,
          style: configs.getDefaultGeoJSONStyle(),
        },
        codeRules: [
          (value) => {
            if (value?.length > 3) return true;
            return "Name must be at least 3 characters.";
          },
        ],
        nameRules: [
          (value) => {
            if (value?.length > 5) return true;
            return "Name must be at least 5 characters.";
          },
        ],
        descriptionRules: [
          (value) => {
            if (value?.length > 10) return true;
            return "Description must be at least 10 characters.";
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
        if (!value) {
          this.clearForm();
        }
        this.dialogVisible = value;
      },
      dialogVisible(value) {
        this.$emit("update:open", value);
      },
    },
    methods: {
      clearForm() {
        this.newLayer = {
          code: null,
          name: null,
          description: null,
          type: null,
          style: configs.getDefaultGeoJSONStyle(),
        };
        this.$refs.form.resetValidation();
      },
      async saveLayer() {
        // Set the loading state
        this.loading = true;

        // Validate the form
        const { valid } = await this.$refs.form.validate();

        // Check if the form is valid
        if (valid) {
          // Create the layer
          await this.$store.dispatch("layers/CREATE", { data: this.newLayer });

          // Reset the loading state
          this.loading = false;

          // Close the dialog
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
