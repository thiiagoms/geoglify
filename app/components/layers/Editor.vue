<template>
  <v-dialog v-model="dialogVisible" max-width="800px" persistent scrollable>
    <v-card>
      <v-card-title class="font-weight-black py-5">EDIT LAYER</v-card-title>
      <v-divider></v-divider>

      <v-card-text>
        <v-form ref="form">
          <v-text-field v-model="updatedLayer.code" label="Code" placeholder="Enter code" variant="outlined" :rules="codeRules" required class="mb-2"></v-text-field>

          <v-text-field v-model="updatedLayer.name" label="Name" placeholder="Enter Name" variant="outlined" :rules="nameRules" required class="mb-2"></v-text-field>

          <v-textarea v-model="updatedLayer.description" label="Description" placeholder="Enter Description" variant="outlined" :rules="descriptionRules" required rows="2" class="mb-2"></v-textarea>

          <v-select v-model="updatedLayer.type" :items="layerTypes" label="Type" placeholder="Select Type" required variant="outlined" :rules="typeRules" class="mb-2" readonly disabled></v-select>
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
          type: null,
          style: null,
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
          await this.$store.dispatch("layers/UPDATE", { layerId: this.updatedLayer.id, data: this.updatedLayer });
          this.closeDialog();
        }
      },
      closeDialog() {
        this.dialogVisible = false;
      },
    },
  };
</script>
