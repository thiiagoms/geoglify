import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";

import * as convert from "convert-units";

const DRAW_LABELS_SOURCE_ID = "source-draw-labels";
const DRAW_LABELS_LAYER_ID = "layer-draw-labels";
const SOURCE_DATA = {
  type: "FeatureCollection",
  features: [],
};

export default class MeasuresControl {
  constructor(options) {
    this.options = options;
    this._numberFormattingOptions = {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: "always",
    };
    this._drawCtrl = new MapboxDraw({
      displayControlsDefault: false,
      styles: [
        // ACTIVE (being drawn)
        // line stroke
        {
          id: "gl-draw-line",
          type: "line",
          filter: ["all", ["==", "$type", "LineString"], ["!=", "mode", "static"]],
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": this.options?.style?.lengthMeasurement?.lineColor ?? "#D20C0C",
            "line-dasharray": [0.2, 2],
            "line-width": this.options?.style?.lengthMeasurement?.lineWidth ?? 2,
          },
        },
        // polygon fill
        {
          id: "gl-draw-polygon-fill",
          type: "fill",
          filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
          paint: {
            "fill-color": this.options?.style?.areaMeasurement?.fillColor ?? "#D20C0C",
            "fill-outline-color": this.options?.style?.areaMeasurement?.fillOutlineColor ?? "#D20C0C",
            "fill-opacity": this.options?.style?.areaMeasurement?.fillOpacity ?? 0.1,
          },
        },
        // polygon mid points
        {
          id: "gl-draw-polygon-midpoint",
          type: "circle",
          filter: ["all", ["==", "$type", "Point"], ["==", "meta", "midpoint"]],
          paint: {
            "circle-radius": this.options?.style?.common?.midPointRadius ?? 3,
            "circle-color": this.options?.style?.common?.midPointColor ?? "#fbb03b",
          },
        },
        // polygon outline stroke
        // This doesn't style the first edge of the polygon, which uses the line stroke styling instead
        {
          id: "gl-draw-polygon-stroke-active",
          type: "line",
          filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": this.options?.style?.areaMeasurement?.fillOutlineColor ?? "#D20C0C",
            "line-dasharray": [0.2, 2],
            "line-width": this.options?.style?.areaMeasurement?.lineWidth ?? 2,
          },
        },
        // vertex point halos
        {
          id: "gl-draw-polygon-and-line-vertex-halo-active",
          type: "circle",
          filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
          paint: {
            "circle-radius": this.options?.style?.common?.midPointHaloRadius ?? 3,
            "circle-color": this.options?.style?.common?.midPointHaloColor ?? "#FFF",
          },
        },
        // vertex points
        {
          id: "gl-draw-polygon-and-line-vertex-active",
          type: "circle",
          filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
          paint: {
            "circle-radius": this.options?.style?.common?.midPointRadius ?? 3,
            "circle-color": this.options?.style?.common?.midPointColor ?? "#fbb03b",
          },
        },

        // INACTIVE (static, already drawn)
        // line stroke
        {
          id: "gl-draw-line-static",
          type: "line",
          filter: ["all", ["==", "$type", "LineString"], ["==", "mode", "static"]],
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": this.options?.style?.lengthMeasurement?.lineColor ?? "#D20C0C",
            "line-width": this.options?.style?.lengthMeasurement?.lineWidth ?? 3,
          },
        },
        // polygon fill
        {
          id: "gl-draw-polygon-fill-static",
          type: "fill",
          filter: ["all", ["==", "$type", "Polygon"], ["==", "mode", "static"]],
          paint: {
            "fill-color": this.options?.style?.areaMeasurement?.fillColor ?? "#000",
            "fill-outline-color": this.options?.style?.areaMeasurement?.fillOutlineColor ?? "#000",
            "fill-opacity": this.options?.style?.areaMeasurement?.fillOpacity ?? 0.1,
          },
        },
        // polygon outline
        {
          id: "gl-draw-polygon-stroke-static",
          type: "line",
          filter: ["all", ["==", "$type", "Polygon"], ["==", "mode", "static"]],
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": this.options?.style?.areaMeasurement?.fillOutlineColor ?? "#000",
            "line-width": this.options?.style?.areaMeasurement?.lineWidth ?? 2,
          },
        },
      ],
    });
  }

  onAdd(map) {
    this._map = map;
    this._map.addControl(this._drawCtrl, "top-left");
    this._initControl();
    this._registerEvents();
    return this._container;
  }

  _initControl() {
    this._container = document.createElement("div");
    this._container.className = "maplibregl-ctrl mapboxgl-ctrl maplibregl-measures maplibregl-ctrl-group mapboxgl-ctrl-group";

    this.initDrawBtn(this._drawCtrl.modes.DRAW_LINE_STRING);
    this.initDrawBtn(this._drawCtrl.modes.DRAW_POLYGON);
    this.initClearBtn();
  }

  _formatMeasure(dist, isAreaMeasurement = false) {
    if (this.options?.units == "imperial") {
      return isAreaMeasurement ? this._formatAreaToImperialSystem(dist) : this._formatToImperialSystem(dist);
    } else {
      return isAreaMeasurement ? this._formatAreaToMetricSystem(dist) : this._formatToMetricSystem(dist);
    }
  }

  // area in sqm
  _formatAreaToMetricSystem(dist) {
    let measure = convert(dist).from("m2").toBest({ system: "metric" });
    let unit = measure.unit.replaceAll("2", "²");
    let val = this._getLocaleNumber(measure.val);
    return `${val} ${unit}`;
  }

  // area in sqm
  _formatAreaToImperialSystem(dist) {
    let measure = convert(dist).from("m2").to("mi2");
    measure = convert(measure).from("mi2").toBest({ system: "imperial" });
    let unit = measure.unit.replaceAll("2", "²");
    let val = this._getLocaleNumber(measure.val);
    return `${val} ${unit}`;
  }

  _formatToMetricSystem(dist) {
    let measure = convert(dist).from("m").toBest({ system: "metric" });
    let val = this._getLocaleNumber(measure.val);
    return `${val} ${measure.unit}`;
  }

  _formatToImperialSystem(dist) {
    let measure = convert(dist).from("m").to("mi");
    measure = convert(measure).from("mi").toBest({ system: "imperial" });
    let val = this._getLocaleNumber(measure.val);
    return `${val} ${measure.unit}`;
  }

  _getLocaleNumber(val) {
    // Format without grouping separator
    let formattedNumber = val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: this.options?.unitsGroupingSeparator ? false : true,
    });

    let groupingSeparator = this.options?.unitsGroupingSeparator;
    if (groupingSeparator) {
      // Insert spaces for grouping
      formattedNumber = formattedNumber.replace(/\B(?=(\d{3})+(?!\d))/g, groupingSeparator);
    }

    return formattedNumber;
  }

  initDrawBtn(mode) {
    let btn = document.createElement("button");
    btn.type = "button";
    switch (mode) {
      case this._drawCtrl.modes.DRAW_LINE_STRING:
        btn.title = this.options?.lang?.lengthMeasurementButtonTitle ?? "";
        btn.className = "length_control";
        break;
      case this._drawCtrl.modes.DRAW_POLYGON:
        btn.title = this.options?.lang?.areaMeasurementButtonTitle ?? "";
        btn.className = "area_control";

        break;
    }
    btn.addEventListener("click", () => {
      this._drawCtrl.changeMode(mode);
    });
    this._container.appendChild(btn);
  }

  initClearBtn() {
    let btn = document.createElement("button");
    btn.type = "button";
    btn.title = this.options?.lang?.clearMeasurementsButtonTitle ?? "";
    btn.className = "clear_control";

    btn.addEventListener("click", () => {
      this._drawCtrl.deleteAll();
      this._updateLabels();
    });
    this._container.appendChild(btn);
  }

  _registerEvents() {
    if (this._map) {
      this._map.on("load", () => {
        this._recreateSourceAndLayers();
      });
      this._map.on("draw.create", this._updateLabels.bind(this));
      this._map.on("draw.update", this._updateLabels.bind(this));
      this._map.on("draw.delete", this._updateLabels.bind(this));
      this._map.on("draw.render", this._updateLabels.bind(this));
    }
  }

  _recreateSourceAndLayers() {

    if (!this._map.getSource(DRAW_LABELS_SOURCE_ID))
      this._map.addSource(DRAW_LABELS_SOURCE_ID, {
        type: "geojson",
        data: SOURCE_DATA,
      });

    if (!this._map.getLayer(DRAW_LABELS_LAYER_ID))
      this._map.addLayer({
        id: DRAW_LABELS_LAYER_ID,
        type: "symbol",
        source: DRAW_LABELS_SOURCE_ID,
        layout: {
          "text-font": [this.options?.style?.text?.font ?? "Klokantech Noto Sans Bold"],
          "text-field": ["get", "measurement"],
          "text-variable-anchor": ["top", "bottom", "left", "right"],
          "text-radial-offset": this.options?.style?.text?.radialOffset ?? 0.5,
          "text-justify": "auto",
          "text-letter-spacing": this.options?.style?.text?.letterSpacing ?? 0.05,
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            10,
            10,
            12.0,
            13,
            14.0,
            14,
            16.0,
            18,
            18.0, // Change 15.0 to 10.0 or lower
          ],
        },
        paint: {
          "text-color": this.options?.style?.text?.color ?? "#D20C0C",
          "text-halo-color": this.options?.style?.text?.haloColor ?? "#fff",
          "text-halo-width": this.options?.style?.text?.haloWidth ?? 10,
        },
      });
  }

  _reorderLayers() {
    if (this._map) {
      let mapboxGlSources = Object.values(MapboxDraw.constants.sources);
      this._map
        .getStyle()
        .layers.filter((l) => mapboxGlSources.includes(l.source))
        .forEach((l) => {
          this._map.moveLayer(l.id);
        });

      // move to top
      this._map.moveLayer(DRAW_LABELS_LAYER_ID);
    }
  }

  _updateLabels() {

    let source = this._map.getSource(DRAW_LABELS_SOURCE_ID);

    if (!source && this._map) {
      // in case of the source is somehow missing, recreate and empty one
      this._recreateSourceAndLayers();
      source = this._map.getSource(DRAW_LABELS_SOURCE_ID);
    }

    // Build up the centroids for each segment into a features list, containing a property
    // to hold up the measurements
    let features = [];
    // Generate features from what we have on the drawControl:
    let drawnFeatures = this._drawCtrl.getAll();
    drawnFeatures.features.forEach((feature) => {
      try {
        if (feature.geometry.type == "Polygon") {
          let area = this._formatMeasure(turf.area(feature), true);
          let centroid = turf.centroid(feature);
          let measurement = `${area}`;
          centroid.properties = {
            measurement,
          };
          features.push(centroid);
        } else if (feature.geometry.type == "LineString") {
          let segments = turf.lineSegment(feature);
          segments.features.forEach((segment) => {
            let centroid = turf.centroid(segment);
            let lineLength = this._formatMeasure(turf.length(segment) * 1000); //km to m
            let measurement = `${lineLength}`;
            centroid.properties = {
              measurement,
            };
            features.push(centroid);
          });
        }
      } catch (e) {
        //Silently ignored
      }
    });
    let data = {
      type: "FeatureCollection",
      features: features,
    };
    source.setData(data);

    this._reorderLayers();
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map.removeLayer(DRAW_LABELS_LAYER_ID);
    this._map.removeSource(DRAW_LABELS_SOURCE_ID);
    this._map = undefined;
  }
}
