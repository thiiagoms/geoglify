<template>
  <v-dialog v-model="dialogVisible" max-width="800px" persistent scrollable>
    <!-- Dialog content -->
    <v-card>
      <v-card-title class="font-weight-black py-5">EDIT STYLE</v-card-title>
      <v-divider></v-divider>

      <v-card-text v-if="!!styleToUpdate">
        <v-form ref="form">
          <div class="preview-container mb-5">
            <Preview
              :style.sync="styleToUpdate"
              :type.sync="layerType"
            ></Preview>
          </div>

          <!-- Additional fields for point type layers -->
          <template v-if="layerType === 'point'">
            <v-menu open-on-click :close-on-content-click="false">
              <template v-slot:activator="{ props }">
                <v-text-field
                  v-model="styleToUpdate.lineColor"
                  label="Line Color"
                  placeholder="Enter Line Color"
                  variant="outlined"
                  class="mb-2"
                  readonly
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
              min="1"
              max="10"
              step="1"
              thumb-label
              class="my-5"
            ></v-slider>

            <v-menu open-on-click :close-on-content-click="false">
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
              min="1"
              max="20"
              step="1"
              thumb-label
              class="my-5"
            ></v-slider>
          </template>

          <!-- Additional fields for line type layers -->
          <template v-else-if="layerType === 'line'">
            <v-menu open-on-click :close-on-content-click="false">
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
              min="1"
              max="10"
              step="1"
              thumb-label
              class="my-5"
            ></v-slider>

            <v-text-field
              v-model="styleToUpdate.dashArray"
              label="Dash Array Line"
              placeholder="Enter Dash Array"
              variant="outlined"
              class="mb-2"
              v-maska:[dashArray]
            />
          </template>

          <!-- Additional fields for polygon type layers -->
          <template v-else-if="layerType === 'polygon'">
            <v-menu open-on-click :close-on-content-click="false">
              <template v-slot:activator="{ props }">
                <v-text-field
                  v-model="styleToUpdate.lineColor"
                  label="Line Color"
                  placeholder="Enter Line Color"
                  variant="outlined"
                  class="mb-2"
                  readonly
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
              min="1"
              max="10"
              step="1"
              thumb-label
              class="my-5"
            ></v-slider>

            <v-text-field
              v-model="styleToUpdate.dashArray"
              label="Dash Array Line"
              placeholder="Enter Dash Array"
              variant="outlined"
              class="mb-2"
              v-maska:[dashArray]
            />

            <v-menu open-on-click :close-on-content-click="false">
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

            <v-select
              v-model="styleToUpdate.fillPattern"
              :items="patterns"
              item-text="title"
              item-value="value"
              :item-props="itemProps"
              label="Fill Pattern"
              placeholder="Select Fill Pattern"
              variant="outlined"
              class="mb-2"
              density="compact"
            >
              <template v-slot:selection="data">
                <v-list-item
                  :title="data.item.title"
                  :prepend-avatar="'./patterns/' + data.item.value + '.png'"
                  class="pa-0 pattern"
                ></v-list-item>
              </template>
              <template v-slot:item="{ props, item }">
                <v-list-item
                  v-bind="props"
                  :title="item.title"
                  :prepend-avatar="'./patterns/' + item.value + '.png'"
                  class="pa-0 pl-2 pattern"
                ></v-list-item>
              </template>
            </v-select>
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
  radius: 6,
  lineWidth: 5,
  fillColor: "#DF950D", // Default fill color1
  lineColor: "#000000ff", // Default Line Color
  dashArray: "0,0", // Default dash array
  fillPattern: "none", // Default fill pattern
  fillPatternScale: 100, // Default fill pattern scale
  fillPatternOffset: [0, 0], // Default fill pattern offset
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
      patterns: [
        { title: "None", value: "none" },
        { title: "Abstract 01", value: "abstract-01" },
        { title: "Abstract 02", value: "abstract-02" },
        { title: "Abstract 03", value: "abstract-03" },
        { title: "Abstract 04", value: "abstract-04" },
        { title: "Abstract 05", value: "abstract-05" },
        { title: "Abstract 06", value: "abstract-06" },
        { title: "Abstract 07", value: "abstract-07" },
        { title: "Crosshatch 01", value: "crosshatch-01" },
        { title: "Crosshatch 02", value: "crosshatch-02" },
        { title: "Crosshatch 03", value: "crosshatch-03" },
        { title: "Crosshatch 04", value: "crosshatch-04" },
        { title: "Lines D 01", value: "lines-d-01" },
        { title: "Lines D 02", value: "lines-d-02" },
        { title: "Lines D 03", value: "lines-d-03" },
        { title: "Lines D 04", value: "lines-d-04" },
        { title: "Lines D 05", value: "lines-d-05" },
        { title: "Lines D 06", value: "lines-d-06" },
        { title: "Lines D 07", value: "lines-d-07" },
        { title: "Lines D 08", value: "lines-d-08" },
        { title: "Lines D 09", value: "lines-d-09" },
        { title: "Lines D 10", value: "lines-d-10" },
        { title: "Lines H 01", value: "lines-h-01" },
        { title: "Lines H 02", value: "lines-h-02" },
        { title: "Lines H 03", value: "lines-h-03" },
        { title: "Lines H 04", value: "lines-h-04" },
        { title: "Lines V 01", value: "lines-v-01" },
        { title: "Lines V 02", value: "lines-v-02" },
        { title: "Lines V 03", value: "lines-v-03" },
        { title: "Lines V 04", value: "lines-v-04" },
        { title: "Shapes 01", value: "shapes-01" },
        { title: "Shapes 02", value: "shapes-02" },
        { title: "Shapes 03", value: "shapes-03" },
        { title: "Shapes 04", value: "shapes-04" },
        { title: "Shapes 05", value: "shapes-05" },
        { title: "Shapes 06", value: "shapes-06" },
        { title: "Shapes 07", value: "shapes-07" },
        { title: "Shapes 08", value: "shapes-08" },
        { title: "Shapes 09", value: "shapes-09" },
        { title: "Shapes 10", value: "shapes-10" },
        { title: "Shapes 11", value: "shapes-11" },
      ],
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

      await this.layersStoreInstance.updateLayerStyle(this.layerId, {
        ...this.styleToUpdate,
      });

      this.closeDialog();
    },
    closeDialog() {
      this.dialogVisible = false;
      this.styleToUpdate = null;
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
    itemProps(item) {
      return {
        title: item.title,
        subtitle: item.value,
        "prepend-avatar": "/patterns/" + item.value + ".png",
      };
    },
  },
};
</script>

<style>
.preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  background-color: #ebeaea;
  height: 200px;
}

.pattern .v-avatar {
  background-color: #ebeaea;
  height: 24px;
  width: 24px;
  margin-left: 5px;
}
</style>
