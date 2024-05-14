<template>
  <v-dialog v-model="dialogVisible" max-width="800px" persistent scrollable>
    <v-card>
      <v-card-title class="font-weight-bold">Create Layer</v-card-title>

      <v-divider></v-divider>

      <v-card-text>
        <v-form ref="form">
          <v-text-field v-model="newLayer.name" label="Name" placeholder="Enter Name" variant="outlined" counter="30" :rules="nameRules" required class="mb-2"></v-text-field>

          <v-textarea v-model="newLayer.description" label="Description" placeholder="Enter Description" counter="100" variant="outlined" :rules="descriptionRules" required rows="2" class="mb-2"></v-textarea>

          <v-select v-model="newLayer.type" :items="layerTypes" label="Type" placeholder="Select Type" required variant="outlined" :rules="typeRules" class="mb-2"></v-select>

          <v-text-field v-model="newLayer.datasource" label="Datasource" placeholder="Enter Datasource" variant="outlined" class="mb-2"></v-text-field>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="closeDialog" :disabled="loading">Cancel</v-btn>
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
          name: null,
          description: null,
          type: null,
          datasource: null,
          style: configs.getDefaultGeoJSONStyle(),
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
        datasourceRules: [(value) => !!value || "Datasource is required"],
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
          name: null,
          description: null,
          type: null,
          datasource: null,
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
