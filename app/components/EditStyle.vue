<template>
  <v-dialog v-model="dialogVisible" max-width="800px" persistent scrollable>
    <v-card>
      <v-toolbar color="blue-grey-darken-3" dark>
        <v-toolbar-title class="font-weight-black"> NEW LAYER </v-toolbar-title>
      </v-toolbar>

      <v-card-text>
        <v-form ref="form">
         
          <!-- Campos existentes para todos os tipos de camada -->
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

          <template v-if="newLayer.type === 'point'">
            <!-- Campos adicionais para camadas do tipo ponto -->
            <v-menu open-on-hover>
              <template v-slot:activator="{ props }">
                <v-text-field
                  v-model="newLayer.style.borderColor"
                  label="Border Color"
                  placeholder="Enter Border Color"
                  variant="outlined"
                  class="mb-2"
                  readonly
                  v-bind="props"
                >
                  <template v-slot:append-inner>
                    <div
                      :style="{
                        backgroundColor: newLayer.style.borderColor.slice(
                          0,
                          -2
                        ),
                        width: '24px',
                        height: '24px',
                      }"
                    ></div>
                  </template>
                </v-text-field>
              </template>

              <v-color-picker
                v-model="newLayer.style.borderColor"
              ></v-color-picker>
            </v-menu>

            <v-slider
              v-model="newLayer.style.borderSize"
              label="Border Size"
              min="0"
              max="10"
              step="1"
              thumb-label
              class="my-5"
            ></v-slider>

            <v-menu open-on-hover>
              <template v-slot:activator="{ props }">
                <v-text-field
                  v-model="newLayer.style.fillColor"
                  label="Fill Color"
                  placeholder="Enter Fill Color"
                  variant="outlined"
                  class="mb-2"
                  readonly
                  v-bind="props"
                >
                  <template v-slot:append-inner>
                    <div
                      :style="{
                        backgroundColor: newLayer.style.fillColor.slice(0, -2),
                        width: '24px',
                        height: '24px',
                      }"
                    ></div>
                  </template>
                </v-text-field>
              </template>

              <v-color-picker
                v-model="newLayer.style.fillColor"
              ></v-color-picker>
            </v-menu>

            <v-slider
              v-model="newLayer.style.radius"
              label="Radius size"
              min="0"
              max="10"
              step="1"
              thumb-label
              class="my-5"
            ></v-slider>
          </template>

          <template v-else-if="newLayer.type === 'line'">
            <!-- Campos adicionais para camadas do tipo linha -->
            <v-menu open-on-hover>
              <template v-slot:activator="{ props }">
                <v-text-field
                  v-model="newLayer.style.lineColor"
                  label="Line Color"
                  placeholder="Enter Line Color"
                  readonly
                  variant="outlined"
                  class="mb-2"
                  v-bind="props"
                >
                  <template v-slot:append-inner>
                    <div
                      :style="{
                        backgroundColor: newLayer.style.lineColor.slice(0, -2),
                        width: '24px',
                        height: '24px',
                      }"
                    ></div>
                  </template>
                </v-text-field>
              </template>

              <v-color-picker
                v-model="newLayer.style.lineColor"
              ></v-color-picker>
            </v-menu>

            <v-slider
              v-model="newLayer.style.lineWidth"
              label="Line Width"
              min="0"
              max="10"
              step="1"
              thumb-label
              class="my-5"
            ></v-slider>
          </template>

          <template v-else-if="newLayer.type === 'polygon'">
            <!-- Campos adicionais para camadas do tipo polígono -->
            <v-menu open-on-hover>
              <template v-slot:activator="{ props }">
                <v-text-field
                  v-model="newLayer.style.borderColor"
                  label="Border Color"
                  placeholder="Enter Border Color"
                  variant="outlined"
                  class="mb-2"
                  readonly
                  v-bind="props"
                >
                  <template v-slot:append-inner>
                    <div
                      :style="{
                        backgroundColor: newLayer.style.borderColor.slice(
                          0,
                          -2
                        ),
                        width: '24px',
                        height: '24px',
                      }"
                    ></div>
                  </template>
                </v-text-field>
              </template>

              <v-color-picker
                v-model="newLayer.style.borderColor"
              ></v-color-picker>
            </v-menu>

            <v-slider
              v-model="newLayer.style.borderSize"
              label="Border Size"
              min="0"
              max="10"
              step="1"
              thumb-label
              class="my-5"
            ></v-slider>

            <v-menu open-on-hover>
              <template v-slot:activator="{ props }">
                <v-text-field
                  v-model="newLayer.style.fillColor"
                  label="Fill Color"
                  placeholder="Enter Fill Color"
                  variant="outlined"
                  class="mb-2"
                  readonly
                  v-bind="props"
                >
                  <template v-slot:append-inner>
                    <div
                      :style="{
                        backgroundColor: newLayer.style.fillColor.slice(0, -2),
                        width: '24px',
                        height: '24px',
                      }"
                    ></div>
                  </template>
                </v-text-field>
              </template>

              <v-color-picker
                v-model="newLayer.style.fillColor"
              ></v-color-picker>
            </v-menu>
          </template>

          <div class="svg-container">
            <svg width="100" height="100">
              <!-- Renderização do SVG de acordo com o tipo de camada e estilos -->
              <template v-if="newLayer.type === 'point'">
                <circle
                  cx="50"
                  cy="50"
                  :r="newLayer.style.radius * 5"
                  :stroke="hexToRgba(newLayer.style.borderColor)"
                  :fill="hexToRgba(newLayer.style.fillColor)"
                  :stroke-width="newLayer.style.borderSize"
                />
              </template>
              <template v-else-if="newLayer.type === 'line'">
                <line
                  x1="10"
                  y1="10"
                  x2="90"
                  y2="90"
                  :stroke="hexToRgba(newLayer.style.lineColor)"
                  :stroke-width="newLayer.style.lineWidth"
                />
              </template>
              <template v-else-if="newLayer.type === 'polygon'">
                <rect
                  x="10"
                  y="10"
                  width="80"
                  height="80"
                  :stroke="hexToRgba(newLayer.style.borderColor)"
                  :fill="hexToRgba(newLayer.style.fillColor)"
                  :stroke-width="newLayer.style.borderSize"
                />
              </template>
            </svg>
          </div>
        </v-form>
      </v-card-text>
      <v-divider></v-divider>
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
      menu: false,
      newLayer: {
        name: null,
        description: null,
        type: "point",
        file: null,
        style: {
          radius: 1,
          borderSize: 1,
          lineWidth: 1,
          fillColor: "#000000FF",
          borderColor: "#000000FF",
          lineColor: "#000000FF",
        },
        features: [],
        hasError: false,
        msgError: "",
      },
      nameRules: [
        (value) => {
          if (value?.length > 3) return true;
          return "Name must be at least 3 characters.";
        },
      ],
      descriptionRules: [
        (value) => {
          if (value?.length > 3) return true;
          return "Description must be at least 3 characters.";
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
    hexToRgba(hex) {
      // Extrair os componentes R, G, B e A do formato hexa
      const r = parseInt(hex.substring(1, 3), 16);
      const g = parseInt(hex.substring(3, 5), 16);
      const b = parseInt(hex.substring(5, 7), 16);
      const a = parseInt(hex.substring(7, 9), 16) / 255; // Canal alfa

      // Retornar a string no formato RGBA
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    },
    handleFileUpload(event) {

      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const geoJsonData = JSON.parse(e.target.result);

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

<style scoped>
.svg-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  background-color: #ebeaea;
}
</style>
