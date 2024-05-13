<template>
  <v-dialog v-model="dialogVisible" max-width="800px" persistent scrollable>
    <v-card>
      <v-card-title class="font-weight-bold">Upload Data into Layer</v-card-title>

      <v-divider></v-divider>

      <v-card-text>

        <v-alert class="mb-5">
          You can only upload GeoJSON files. All existing data in the layer will be replaced.
        </v-alert>
        <v-form ref="form">
          <v-file-input counter show-size label="GeoJSON File" @change="handleFileUpload" accept=".geojson" variant="outlined" class="mb-2" append-inner-icon="mdi-paperclip" prepend-icon="" :rules="fileRules"></v-file-input>
        </v-form>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="closeDialog" :disabled="loading">Cancel</v-btn>
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
        fileRules: [(value) => !value || !value.length || value[0].size < 25000000 || 'GeoJSON size should be less than 25 MB!'],
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
        this.file = event.target.files[0];
      },
      async uploadData() {
        this.loading = true;
        const { valid } = await this.$refs.form.validate();
        if (valid && !!this.file) {
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
