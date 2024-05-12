<template>
  <v-dialog v-model="dialogVisible" max-width="800px" persistent scrollable>
    <v-card>
      <v-toolbar class="fixed-bar" color="white" dark style="border-bottom: 1px solid #ccc">
        <v-toolbar-title class="text-h5 font-weight-black pl-4"> Upload Data into Layer </v-toolbar-title>

        <v-spacer></v-spacer>

        <v-btn icon @click="closeDialog" density="compact" class="ml-1">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-divider></v-divider>

      <v-card-text>
        <v-form ref="form">
          <v-file-input label="GeoJSON File" type="file" @change="handleFileUpload" accept=".geojson" variant="outlined" class="mb-2" append-inner-icon="mdi-paperclip" prepend-icon="" :rules="fileRules"></v-file-input>
        </v-form>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="uploadData" :loading="loading" :disabled="loading">Upload</v-btn>
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
        loading: false,
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
        this.loading = true;
        const { valid } = await this.$refs.form.validate();
        if (valid) {
          await this.$store.dispatch("layers/UPLOAD_DATA", { layerId: this.id, file: this.file });
          this.loading = false;
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
