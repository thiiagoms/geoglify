<template>
  <v-dialog v-model="dialogVisible" max-width="500px" persistent>
    <v-card>

      <v-expand-transition>
        <div v-if="hasError">
          <v-alert class="mb-0" tile type="error">
            {{ msgError }}
          </v-alert>
        </div>
      </v-expand-transition>

      <v-toolbar dark>
        <v-toolbar-title class="font-weight-black"> NEW LAYER </v-toolbar-title>
      </v-toolbar>

      <v-card-text>
        <v-form ref="form">
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
            class="mb-2"
          ></v-textarea>

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
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" text @click="closeDialog">Close</v-btn>
        <v-btn color="blue darken-1" text @click="saveLayer">Save</v-btn>
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
      newLayer: {
        name: null,
        description: null,
        type: null,
        file: null,
        style: {},
        features: [],
        hasError: false,
        msgError: "",
      },
      nameRules: [
        (value) => {
          if (value?.length > 10) return true;
          return "Name must be at least 10 characters.";
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
      if (valid && !this.hasError) {
        //delete file prop from newLayer
        delete this.newLayer.file;
        await this.layersStoreInstance.createLayer(this.newLayer);
        this.closeDialog();
      }
    },
    closeDialog() {
      this.hasError = false
      this.msgError = "";
      this.dialogVisible = false;
    },
    handleFileUpload(event) {

      this.hasError = false
      this.msgError = "";

      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const geoJsonData = JSON.parse(e.target.result);

        //validate geoJsonData checking if all features types is similiar layertype choosen
        const layertype = this.newLayer.type.toLowerCase();
        const invalidFeatures = geoJsonData.features.filter(
          (feature) => feature.geometry.type.toLowerCase() !== layertype
        );

        if (invalidFeatures.length > 0) {
          this.hasError = true;
          this.msgError = `Invalid GeoJSON file. All features must be of type ${layertype}`;
          return;
        }

        this.newLayer.features = geoJsonData.features;
      };
      reader.readAsText(file);
    },
  },
};
</script>
