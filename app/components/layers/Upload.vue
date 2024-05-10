<template>
  <v-dialog v-model="dialogVisible" max-width="800px" persistent scrollable>
    <v-card>
      <v-card-title class="font-weight-black py-5">UPLOAD DATA</v-card-title>
      <v-divider></v-divider>

      <v-card-text>
        <v-form ref="form">
          <v-file-input label="GeoJSON File" type="file" @change="handleFileUpload" accept=".geojson" variant="outlined" class="mb-2" append-inner-icon="mdi-paperclip" prepend-icon="" :rules="fileRules"></v-file-input>
        </v-form>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="closeDialog">Cancel</v-btn>
        <v-btn text @click="uploadData">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
  export default {
    props: ["open", "layerId"],
    data() {
      return {
        dialogVisible: false,
        menu: false,
        file: null,
        fileRules: [(value) => !!value || "GeoJSON file is required"],
        id: null,
      };
    },
    watch: {
      open(value) {
        this.dialogVisible = value;
        if (value && this.layerId) {
          this.loadLayerId(this.layerId);
        }
      },
      dialogVisible(value) {
        this.$emit("update:open", value);
      },
    },
    methods: {
      async loadLayerId(id) {
        this.id = id;
      },
      handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        this.file = file;
      },
      async uploadData() {
        const { valid } = await this.$refs.form.validate();
        if (valid) {
          await this.$store.dispatch("layers/UPLOAD", { layerId: this.id, file: this.file });
          this.closeDialog();
        }
      },
      closeDialog() {
        this.dialogVisible = false;
      },
    },
  };
</script>
