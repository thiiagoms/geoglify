<template>
  <v-dialog v-model="dialogVisible" max-width="800px" persistent scrollable>
    <v-card>
      <v-card-title class="font-weight-black py-5">ADD NEW LAYER</v-card-title>
      <v-divider></v-divider>

      <v-card-text>
        <v-form ref="form">
          <v-text-field
            v-model="newLayer.code"
            label="Code"
            placeholder="Enter code"
            variant="outlined"
            :rules="codeRules"
            required
            class="mb-2"
          ></v-text-field>

          <v-text-field
            v-model="newLayer.name"
            label="Name"
            placeholder="Enter Name"
            variant="outlined"
            :rules="nameRules"
            required
            class="mb-2"
          ></v-text-field>

          <v-textarea
            v-model="newLayer.description"
            label="Description"
            placeholder="Enter Description"
            variant="outlined"
            :rules="descriptionRules"
            required
            rows="2"
            class="mb-2"
          ></v-textarea>

          <v-file-input
            v-model="newLayer.file"
            label="GeoJSON File"
            type="file"
            @change="handleFileUpload"
            accept=".geojson"
            variant="outlined"
            class="mb-2"
            append-inner-icon="mdi-paperclip"
            prepend-icon=""
            :rules="fileRules"
          ></v-file-input>

          <v-select
            v-model="newLayer.type"
            :items="layerTypes"
            label="Type"
            placeholder="Select Type"
            required
            variant="outlined"
            :rules="typeRules"
            class="mb-2"
          ></v-select>
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
  props: ["open"],
  data() {
    return {
      dialogVisible: false,
      menu: false,
      newLayer: {
        code: null,
        name: null,
        description: null,
        type: null,
        file: null,
        style: null,
        features: [],
        hasError: false,
        msgError: "",
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
      fileRules: [(value) => !!value || "GeoJSON file is required"],
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
    },
    dialogVisible(value) {
      this.$emit("update:open", value);
    },
  },
  setup() {
    const layersStoreInstance = layersStore();
    return { layersStoreInstance };
  },
  methods: {
    async saveLayer() {
      const { valid } = await this.$refs.form.validate();
      if (valid) {
        delete this.newLayer.file;
        await this.layersStoreInstance.createLayer(this.newLayer);
        this.closeDialog();
      }
    },
    closeDialog() {
      this.dialogVisible = false;
    },
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const geoJsonData = JSON.parse(e.target.result);
        this.newLayer.features = geoJsonData.features;
      };
      reader.readAsText(file);
    },
  },
};
</script>
