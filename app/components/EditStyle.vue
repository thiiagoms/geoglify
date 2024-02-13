<template>
  <v-dialog v-model="dialogVisible" max-width="800px" persistent scrollable>
    <!-- Dialog content -->
    <v-card>
      <v-card-title class="font-weight-black py-5">EDIT STYLE</v-card-title>
      <v-divider></v-divider>

      <v-card-text>
        <v-form ref="form">
          <!-- SVG container to preview the style -->
          <div class="svg-container mb-5">
            <svg width="100" height="100">
              <!-- Rendering SVG according to layer type and style -->
              <template v-if="layerType === 'point' && style">
                <circle
                  cx="50"
                  cy="50"
                  :r="styleToUpdate.radius"
                  :stroke="hexToRgba(styleToUpdate.borderColor)"
                  :fill="hexToRgba(styleToUpdate.fillColor)"
                  :stroke-width="styleToUpdate.borderSize"
                  :stroke-dasharray="styleToUpdate.dashArray?.replace(',', ' ')"
                />
              </template>
              <template v-else-if="layerType === 'line' && style">
                <line
                  x1="10"
                  y1="10"
                  x2="90"
                  y2="90"
                  :stroke="hexToRgba(styleToUpdate.lineColor)"
                  :stroke-width="styleToUpdate.lineWidth"
                  :stroke-dasharray="styleToUpdate.dashArray?.replace(',', ' ')"
                />
              </template>

              <template v-else-if="layerType === 'polygon' && style">
                <rect
                  x="10"
                  y="10"
                  width="80"
                  height="80"
                  :stroke="hexToRgba(styleToUpdate.borderColor)"
                  :fill="hexToRgba(styleToUpdate.fillColor)"
                  :stroke-width="styleToUpdate.borderSize"
                  :stroke-dasharray="styleToUpdate.dashArray?.replace(',', ' ')"
                />
              </template>
            </svg>
          </div>

          <!-- Additional fields for point type layers -->
          <template v-if="layerType === 'point'">
            <v-menu open-on-hover>
              <template v-slot:activator="{ props }">
                <v-text-field
                  v-model="styleToUpdate.borderColor"
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
                        backgroundColor: hexToRgba(styleToUpdate.borderColor),
                        width: '24px',
                        height: '24px',
                      }"
                    ></div>
                  </template>
                </v-text-field>
              </template>

              <v-color-picker
                v-model="styleToUpdate.borderColor"
              ></v-color-picker>
            </v-menu>

            <v-slider
              v-model="styleToUpdate.borderSize"
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
                  v-model="styleToUpdate.fillColor"
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
                        backgroundColor: hexToRgba(styleToUpdate.fillColor),
                        width: '24px',
                        height: '24px',
                      }"
                    ></div>
                  </template>
                </v-text-field>
              </template>

              <v-color-picker
                v-model="styleToUpdate.fillColor"
              ></v-color-picker>
            </v-menu>

            <v-slider
              v-model="styleToUpdate.radius"
              label="Radius size"
              min="0"
              max="20"
              step="1"
              thumb-label
              class="my-5"
            ></v-slider>

            <v-text-field
              v-model="styleToUpdate.dashArray"
              label="Dash Array"
              placeholder="Enter Dash Array"
              variant="outlined"
              class="mb-2"
              v-maska:[dashArray]
            />
          </template>

          <!-- Additional fields for line type layers -->
          <template v-else-if="layerType === 'line'">
            <v-menu open-on-hover>
              <template v-slot:activator="{ props }">
                <v-text-field
                  v-model="styleToUpdate.lineColor"
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
                        backgroundColor: hexToRgba(styleToUpdate.lineColor),
                        width: '24px',
                        height: '24px',
                      }"
                    ></div>
                  </template>
                </v-text-field>
              </template>

              <v-color-picker
                v-model="styleToUpdate.lineColor"
              ></v-color-picker>
            </v-menu>

            <v-slider
              v-model="styleToUpdate.lineWidth"
              label="Line Width"
              min="0"
              max="10"
              step="1"
              thumb-label
              class="my-5"
            ></v-slider>

            <v-text-field
              v-model="styleToUpdate.dashArray"
              label="Dash Array"
              placeholder="Enter Dash Array"
              variant="outlined"
              class="mb-2"
              v-maska:[dashArray]
            />
          </template>

          <!-- Additional fields for polygon type layers -->
          <template v-else-if="layerType === 'polygon'">
            <v-menu open-on-hover>
              <template v-slot:activator="{ props }">
                <v-text-field
                  v-model="styleToUpdate.borderColor"
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
                        backgroundColor: hexToRgba(styleToUpdate.borderColor),
                        width: '24px',
                        height: '24px',
                      }"
                    ></div>
                  </template>
                </v-text-field>
              </template>

              <v-color-picker
                v-model="styleToUpdate.borderColor"
              ></v-color-picker>
            </v-menu>

            <v-slider
              v-model="styleToUpdate.borderSize"
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
                  v-model="styleToUpdate.fillColor"
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
                        backgroundColor: hexToRgba(styleToUpdate.fillColor),
                        width: '24px',
                        height: '24px',
                      }"
                    ></div>
                  </template>
                </v-text-field>
              </template>

              <v-color-picker
                v-model="styleToUpdate.fillColor"
              ></v-color-picker>
            </v-menu>

            <v-text-field
              v-model="styleToUpdate.dashArray"
              label="Dash Array"
              placeholder="Enter Dash Array"
              variant="outlined"
              class="mb-2"
              v-maska:[dashArray]
            />
          </template>
        </v-form>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="closeDialog">Close</v-btn>
        <v-btn text @click="updateLayerStyle">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { vMaska } from "maska";

const defaultStyle = {
  radius: 1,
  borderSize: 5,
  lineWidth: 1,
  fillColor: "#DF950D", // Default fill color
  borderColor: "#000000ff", // Default border color
  lineColor: "#000000ff", // Default line color
  dashArray: "0,0", // Default dash array
};

export default {
  props: {
    open: Boolean,
    layerType: String,
    style: Object,
    layerId: String,
  },
  setup() {
    const layersStoreInstance = layersStore();
    return { layersStoreInstance };
  },
  directives: { maska: vMaska },
  data() {
    return {
      dialogVisible: false,
      styleToUpdate: defaultStyle,
      dashArray: {
        mask: "#,#",
        eager: true,
      },
    };
  },
  watch: {
    open(value) {
      if (value) {
        this.styleToUpdate = this.style || defaultStyle;
      }

      this.dialogVisible = value;
    },
    dialogVisible(value) {
      this.$emit("update:open", value);
    },
  },
  methods: {
    async updateLayerStyle() {
      if (!this.layerId) {
        console.error("Layer ID not provided.");
        return;
      }

      console.log("Updating layer style", this.styleToUpdate);
      await this.layersStoreInstance.updateLayerStyle(this.layerId, {
        ...this.styleToUpdate,
      });

      this.closeDialog();
    },
    closeDialog() {
      this.dialogVisible = false;
    },
    hexToRgba(hex) {
      if (!hex) return "";

      // If hex is in #rrggbb format, append 'ff' for alpha channel
      if (hex.length === 7) {
        hex += "ff";
      }

      const r = parseInt(hex.substring(1, 3), 16);
      const g = parseInt(hex.substring(3, 5), 16);
      const b = parseInt(hex.substring(5, 7), 16);
      const a = parseInt(hex.substring(7, 9), 16) / 255;

      return `rgba(${r}, ${g}, ${b}, ${a})`;
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
