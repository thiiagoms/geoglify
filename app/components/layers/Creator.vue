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

          <v-file-input v-model="newLayer.file" label="GeoJSON File" type="file" @change="handleFileUpload" accept=".geojson" variant="outlined" class="mb-2" append-inner-icon="mdi-paperclip" prepend-icon="" :rules="fileRules"></v-file-input>

          <v-select v-model="newLayer.type" :items="layerTypes" label="Type" placeholder="Select Type" required variant="outlined" :rules="typeRules" class="mb-2"></v-select>
        
        </v-form>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
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
        this.newLayer.code = null;
        this.newLayer.name = null;
        this.newLayer.description = null;
        this.newLayer.type = null;
        this.newLayer.file = null;
        this.newLayer.style = null;
        this.newLayer.features = [];
        this.newLayer.hasError = false;
        this.newLayer.msgError = "";
        this.$refs.form.resetValidation();
      },
      async saveLayer() {
        const { valid } = await this.$refs.form.validate();
        if (valid) {
          await this.$store.dispatch("layers/CREATE", this.newLayer);
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
