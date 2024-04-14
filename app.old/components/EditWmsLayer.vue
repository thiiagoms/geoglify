<template>
  <v-dialog v-model="dialogVisible" max-width="800px" persistent scrollable>
    <v-card>
      <v-card-title class="font-weight-black py-5">EDIT WMS</v-card-title>
      <v-divider></v-divider>

      <v-card-text>
        <v-form ref="form">
          <v-text-field
            v-model="updatedLayer.code"
            label="Code"
            placeholder="Enter code"
            variant="outlined"
            :rules="codeRules"
            required
            class="mb-2"
          ></v-text-field>

          <v-text-field
            v-model="updatedLayer.name"
            label="Name"
            placeholder="Enter Name"
            variant="outlined"
            :rules="nameRules"
            required
            class="mb-2"
          ></v-text-field>

          <v-textarea
            v-model="updatedLayer.description"
            label="Description"
            placeholder="Enter Description"
            variant="outlined"
            :rules="descriptionRules"
            required
            rows="2"
            class="mb-2"
          ></v-textarea>

          <v-text-field
            v-model="updatedLayer.url"
            label="URL"
            placeholder="Enter URL (WMS)"
            variant="outlined"
            :rules="urlRules"
            required
            class="mb-2"
          ></v-text-field>

          <v-text-field
            v-model="updatedLayer.layers"
            label="Layers"
            placeholder="Enter Layers (comma separated)"
            variant="outlined"
            :rules="layersRules"
            required
            class="mb-2"
          ></v-text-field>
        </v-form>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="closeDialog">Cancel</v-btn>
        <v-btn text @click="saveLayer">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: ["open", "layerData"],
  data() {
    return {
      dialogVisible: false,
      menu: false,
      updatedLayer: {
        code: null,
        name: null,
        description: null,
        url: null,
        layers: null,
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
      urlRules: [
        (value) => {
          var regex = /^(https?|chrome):\/\/[^\s$.?#].[^\s]*$/;
          if (value?.length > 10 && regex.test(value)) return true;
          return "URL is not valid. Must be at least 10 characters.";
        },
      ],
      layersRules: [
        (value) => {
          if (value?.length > 0) return true;
          return "Layers must be at least 1 characters.";
        },
      ],
    };
  },
  setup() {
    const wmsLayersStoreInstance = wmsLayersStore();
    return { wmsLayersStoreInstance };
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
      const { valid } = await this.$refs.form.validate();
      if (valid) {
        await this.wmsLayersStoreInstance.updateLayer(this.updatedLayer);
        this.closeDialog();
      }
    },
    closeDialog() {
      this.dialogVisible = false;
    },
  },
};
</script>
