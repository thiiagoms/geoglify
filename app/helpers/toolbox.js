import MapboxDraw from "@mapbox/mapbox-gl-draw";
import MeasuresControl from "~/helpers/measures";
import configs from "~/helpers/configs";

export default class Toolbox {
  constructor(options) {
    this.options = options;

    // Add the draw control to the map
    MapboxDraw.constants.classes.CONTROL_BASE = "maplibregl-ctrl";
    MapboxDraw.constants.classes.CONTROL_PREFIX = "maplibregl-ctrl-";
    MapboxDraw.constants.classes.CONTROL_GROUP = "maplibregl-ctrl-group";

    this.mode = "none";
  }

  onAdd(map) {
    this._map = map;
    this._initControl();
    return this._container;
  }

  _initControl() {
    this._container = document.createElement("div");
    this._container.className = "maplibregl-ctrl mapboxgl-ctrl maplibregl-measures maplibregl-ctrl-group mapboxgl-ctrl-group";

    this.initMeasuresBtn();
    this.initDrawBtn();
  }

  initMeasuresBtn() {
    let btn = document.createElement("button");
    btn.type = "button";
    btn.title = "Measures";
    btn.className = "measures_control";

    btn.addEventListener("click", () => {
      this.mode = this.mode == "measures" ? "none" : "measures";
      this._setControl(this.mode);
    });

    this._container.appendChild(btn);
  }

  initDrawBtn() {
    let btn = document.createElement("button");
    btn.type = "button";
    btn.title = "Draw";
    btn.className = "draw_control";

    btn.addEventListener("click", () => {
      this.mode = this.mode == "draw" ? "none" : "draw";
      this._setControl(this.mode);
    });

    this._container.appendChild(btn);
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }

  _setControl(mode) {
    switch (mode) {
      case "draw":
        this.draw = new MapboxDraw({
          displayControlsDefault: false,
          styles: configs.getMapDrawStyles(),
          modes: MapboxDraw.modes,
          controls: {
            point: true,
            line_string: true,
            polygon: true,
            trash: true,
            combine_features: true,
            uncombine_features: true,
          },
        });
        this._map.addControl(this.draw, "top-right");
        document.querySelector(".measures_control").style.display = "none";
        break;
      case "measures":
        this.measures = new MeasuresControl();
        this._map.addControl(this.measures, "top-right");
        document.querySelector(".draw_control").style.display = "none";
        break;
      case "none":
        if (this._map.hasControl(this.draw)) {
          this._map.removeControl(this.draw);
        }

        if (this._map.hasControl(this.measures)) {
          this._map.removeControl(this.measures);
        }

        document.querySelector(".draw_control").style.display = "block";
        document.querySelector(".measures_control").style.display = "block";
        break;
    }
  }
}
