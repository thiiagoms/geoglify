// Description: Helper functions to process the data and configurations.

// Import the required libraries
import * as turf from "@turf/turf";
import proj4 from "proj4";

// Import the data files
import CARGOS from "./assets/cargos.json";
import COUNTRIES from "./assets/countries.json";

export default {
  // Get the list of categories
  getCategories() {
    const categorizedCargos = new Map();

    CARGOS.forEach((cargo) => {
      const category = cargo.name.split(",")[0].trim();
      if (!categorizedCargos.has(category)) {
        categorizedCargos.set(category, {
          color: cargo.color,
          name: category,
          cargos: [],
          is_active: true,
        });
      }
      categorizedCargos.get(category).cargos.push(cargo);
      categorizedCargos.get(category).priority = Math.max(categorizedCargos.get(category).priority || 0, cargo.priority);
    });

    return categorizedCargos;
  },

  // Get the list of cargos
  getCargos() {
    return CARGOS;
  },

  // Get the cargo type by code
  getCargoType(code) {
    return CARGOS.find((cargo) => cargo.code === code) || CARGOS[0];
  },

  // Convert hex color to RGB
  hexToRgb(hex, opacity = 1) {
    hex = hex.replace(/^#/, "");

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const a = Math.round(opacity * 255);

    return [r, g, b, a];
  },

  // Get the country code from the MMSI
  getCountryCode(mmsi) {
    let countrycode = "xx";

    // Check if MMSI is valid
    if (!!mmsi && !(mmsi.length < 3)) {
      // Extract the first three characters of the MMSI
      var code = mmsi.substring(0, 3);
      // Check if COUNTRIES is defined and if the code exists in it
      if (COUNTRIES && COUNTRIES[code]) {
        // Return the corresponding country code
        countrycode = COUNTRIES[code][0] ?? "xx";
      }
    }

    return countrycode.toLowerCase();
  },

  // Get the base maps
  getBaseMaps() {
    return [
      {
        id: "geoglify_mapbox",
        name: "Geoglify Mapbox",
        tiles: ["https://api.mapbox.com/styles/v1/leoneldias/clokc8kkj006901plhqene71o/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibGVvbmVsZGlhcyIsImEiOiJjbGV5ZjhiNXMxaHYwM3dta2phanp3ajhxIn0.XQtv4xNQ9x4H99AIcpJW7g"],
        sourceExtraParams: {
          tileSize: 256,
          attribution: `Map data &copy ${new Date().getFullYear()} Mapbox`,
          minzoom: 0,
          maxzoom: 20,
        },
      },
      {
        id: "google_road",
        name: "Google Road",
        tiles: ["https://mt.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&s=Ga"],
        sourceExtraParams: {
          tileSize: 256,
          attribution: `Map data &copy ${new Date().getFullYear()} Google`,
          minzoom: 0,
          maxzoom: 20,
        },
      },
      {
        id: "google_sat",
        name: "Google Sat",
        tiles: ["https://mt.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&s=Ga"],
        sourceExtraParams: {
          tileSize: 256,
          attribution: `Map data &copy ${new Date().getFullYear()} Google`,
          minzoom: 0,
          maxzoom: 20,
        },
      },
      {
        id: "light",
        name: "light",
        tiles: ["https://a.basemaps.cartocdn.com/rastertiles/light_nolabels/{z}/{x}/{y}.png"],
        sourceExtraParams: {
          tileSize: 256,
          attribution: `Map data &copy; OSM ${new Date().getFullYear()} CartoDB`,
          minzoom: 0,
          maxzoom: 19,
        },
      },
      {
        id: "dark",
        name: "dark",
        tiles: ["https://a.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}.png"],
        sourceExtraParams: {
          tileSize: 256,
          attribution: `Map data &copy; OSM ${new Date().getFullYear()} CartoDB`,
          minzoom: 0,
          maxzoom: 19,
        },
      },
      {
        id: "osm",
        name: "Open Street Map",
        tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
        sourceExtraParams: {
          tileSize: 256,
          attribution: "&copy; OpenStreetMap Contributors",
          minzoom: 0,
          maxzoom: 19,
        },
      },
    ];
  },

  // Get the ship geojson
  processGeoJSON(ship) {
    try {
      // Check if the ship is valid
      let originalCoords = ship.location.coordinates;
      let hdg = ship?.hdg;

      let geojson;

      if (!hdg || hdg === 511) {
        // If the ship has no heading or the heading is invalid, create a circle
        const length = (ship?.dimA || 0) + (ship?.dimB || 0) || 10;
        const width = (ship?.dimC || 0) + (ship?.dimD || 0) || 10;

        // Calculate the radius of the circle
        const radius = Math.max(width, length) / 2;
        let circle = turf.circle(originalCoords, radius, { units: "meters" });

        // Create a small circle to represent the antenna
        let antenna = turf.circle(originalCoords, 0.2, { units: "meters" });
        var options = { tolerance: 0.0000001, highQuality: true };
        antenna = turf.simplify(antenna, options);

        // Create a GeoJSON polygon with the circle and the antenna
        geojson = turf.polygon([circle.geometry.coordinates[0], antenna.geometry.coordinates[0]]);
      } else {
        // If the ship has a valid heading, create a ship icon

        const length = (ship?.dimA || 0) + (ship?.dimB || 0) || 60;
        const width = (ship?.dimC || 0) + (ship?.dimD || 0) || 10;

        // Calculate the offset of the ship's dimensions
        const xOffsetA = ship?.dimA || length / 2;
        const xOffsetB = ship?.dimB || length / 2;
        const yOffsetC = ship?.dimC || width / 2;
        const yOffsetD = ship?.dimD || width / 2;

        // Define the source projection
        const source = this.proj4_setdef(originalCoords[0]);

        // Calculate the center of the ship in meters
        const center = this.convertCoordsToMeters(originalCoords, source);

        // Calculate the four points of the ship in meters
        let pointAC = [center[0] - yOffsetC, center[1] + xOffsetA - (xOffsetA + xOffsetB) * 0.1];
        let pointE = [center[0] + (yOffsetD - yOffsetC) / 2, center[1] + xOffsetA];
        let pointAD = [center[0] + yOffsetD, center[1] + xOffsetA - (xOffsetA + xOffsetB) * 0.1];
        let pointBD = [center[0] + yOffsetD, center[1] - xOffsetB];
        let pointBC = [center[0] - yOffsetC, center[1] - xOffsetB];

        // Convert the four points of the ship to WGS84
        let pointACWGS84 = this.convertCoordsToWGS84(pointAC, source);
        let pointEWGS84 = this.convertCoordsToWGS84(pointE, source);
        let pointADWGS84 = this.convertCoordsToWGS84(pointAD, source);
        let pointBDWGS84 = this.convertCoordsToWGS84(pointBD, source);
        let pointBCWGS84 = this.convertCoordsToWGS84(pointBC, source);

        // Rotate the four points of the ship
        let rotatePointAC = this.rotateCoords(pointACWGS84, hdg, originalCoords);
        let rotatePointE = this.rotateCoords(pointEWGS84, hdg, originalCoords);
        let rotatePointAD = this.rotateCoords(pointADWGS84, hdg, originalCoords);
        let rotatePointBD = this.rotateCoords(pointBDWGS84, hdg, originalCoords);
        let rotatePointBC = this.rotateCoords(pointBCWGS84, hdg, originalCoords);

        // Create a small circle to represent the antenna
        let antenna = turf.circle(originalCoords, 0.2, { units: "meters" });
        var options = { tolerance: 0.0000001, highQuality: true };
        antenna = turf.simplify(antenna, options);

        // Create a GeoJSON polygon with the four rotated points
        geojson = turf.polygon([[rotatePointAC, rotatePointE, rotatePointAD, rotatePointBD, rotatePointBC, rotatePointAC], antenna.geometry.coordinates[0]]);
      }

      // Add properties to the GeoJSON
      geojson.properties = {
        color: ship.color,
        colorGeoJson: ship.colorGeoJson,
        shipname: ship.shipname,
        mmsi: ship.mmsi,
        utc: ship.utc,
        _id: ship._id,
      };

      return geojson;
    } catch (error) {
      console.log("Error procesando GeoJSON", error.message);
      return;
    }
  },

  //get utm-zone from longitude degrees
  utmzone_from_lon(lon_deg) {
    return 1 + Math.floor((lon_deg + 180) / 6);
  },

  //get UTM projection definition from longitude
  proj4_setdef(lon_deg) {
    const utm_zone = this.utmzone_from_lon(lon_deg);
    return `+proj=utm +zone=${utm_zone} +datum=WGS84 +units=m +no_defs`;
  },

  // Convert coordinates from WGS84 to meters
  convertCoordsToMeters(coords, target) {
    // Define the source and target projections
    var source = "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees";
    return proj4(source, target, coords);
  },

  // Convert coordinates from meters to WGS84
  convertCoordsToWGS84(coords, source) {
    // Define the source and target projections
    var target = "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees";
    return proj4(source, target, coords);
  },

  // Rotate coordinates around a center point
  rotateCoords(latlonPoint, angleDeg, latlonCenter) {
    var point = turf.point(latlonPoint);
    var options = { pivot: latlonCenter };
    var rotatedPoint = turf.transformRotate(point, angleDeg, options);
    return rotatedPoint.geometry.coordinates;
  },

  // Get the drawstyles
  getMapDrawStyles() {
    return [
      {
        id: "highlight-active-points",
        type: "circle",
        filter: ["all", ["==", "$type", "Point"], ["==", "meta", "feature"], ["==", "active", "true"]],
        paint: {
          "circle-radius": 5,
          "circle-stroke-color": "#FFF",
          "circle-stroke-width": 2,
          "circle-color": "#C62828",
        },
      },
      {
        id: "points-are-blue",
        type: "circle",
        filter: ["all", ["==", "$type", "Point"], ["==", "meta", "feature"], ["==", "active", "false"]],
        paint: {
          "circle-radius": 5,
          "circle-color": "#C62828",
        },
      },
      {
        id: "gl-draw-line",
        type: "line",
        filter: ["all", ["==", "$type", "LineString"], ["!=", "mode", "static"]],
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#C62828",
          "line-width": 4,
        },
      },
      // polygon fill
      {
        id: "gl-draw-polygon-fill",
        type: "fill",
        filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
        paint: {
          "fill-color": "#C62828",
          "fill-outline-color": "#C62828",
          "fill-opacity": 0.1,
        },
      },
      // polygon mid points
      {
        id: "gl-draw-polygon-midpoint",
        type: "circle",
        filter: ["all", ["==", "$type", "Point"], ["==", "meta", "midpoint"]],
        paint: {
          "circle-radius": 5,
          "circle-stroke-color": "#FFF",
          "circle-stroke-width": 2,
          "circle-color": "#C62828",
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
          "line-color": "#C62828",
          "line-width": 5,
        },
      },
      // vertex point halos
      {
        id: "gl-draw-polygon-and-line-vertex-halo-active",
        type: "circle",
        filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
        paint: {
          "circle-radius": 5,
          "circle-stroke-color": "#FFF",
          "circle-stroke-width": 2,
          "circle-color": "#C62828",
        },
      },
      // vertex points
      {
        id: "gl-draw-polygon-and-line-vertex-active",
        type: "circle",
        filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
        paint: {
          "circle-radius": 5,
          "circle-stroke-color": "#FFF",
          "circle-stroke-width": 2,
          "circle-color": "#C62828",
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
          "line-color": "#000",
          "line-width": 5,
        },
      },
      // polygon fill
      {
        id: "gl-draw-polygon-fill-static",
        type: "fill",
        filter: ["all", ["==", "$type", "Polygon"], ["==", "mode", "static"]],
        paint: {
          "fill-color": "#000",
          "fill-outline-color": "#000",
          "fill-opacity": 0.1,
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
          "line-color": "#000",
          "line-width": 5,
        },
      },
    ];
  },

  // Get the draw modes options
  getMeasuresOptions() {
    return {
      lang: {
        areaMeasurementButtonTitle: "Measure area",
        lengthMeasurementButtonTitle: "Measure length",
        clearMeasurementsButtonTitle: "Clear measurements",
      },
      units: "metric", //or metric, the default
      unitsGroupingSeparator: "", // optional. use a space instead of ',' for separating thousands (3 digits group). Do not send this to use the browser default
      style: {
        text: {
          radialOffset: 1,
          letterSpacing: 0,
          color: "#0197f6",
          haloColor: "#fff",
          haloWidth: 2,
        },
        common: {
          midPointRadius: 5,
          midPointColor: "#0197f6",
          midPointHaloRadius: 5,
          midPointHaloColor: "#FFF",
          midPointStrokeColor: "#fff",
          midPointStrokeWidth: 2,
        },
        areaMeasurement: {
          fillColor: "#0197f6",
          fillOutlineColor: "#0197f6",
          fillOpacity: 0.1,
          lineWidth: 4,
        },
        lengthMeasurement: {
          lineWidth: 4,
          lineColor: "#0197f6",
        },
      },
    };
  },

  // Get default geojson style
  getDefaultGeoJSONStyle() {
    return {
      radius: 5,
      lineWidth: 2,
      fillColor: "#0077C9", // Default fill color1
      lineColor: "#FFFFFF", // Default Line Color
      dashArray: "0,0", // Default dash array
      fillPattern: "none", // Default fill pattern
      fillPatternScale: 100, // Default fill pattern scale
      fillPatternOffset: [0, 0], // Default fill pattern offset
    };
  },

  hexToRgbaArray(hex) {
    if (!hex) return [223, 149, 13, 255]; // Return orange with alpha 255 if no color is defined

    // If hex is in #rrggbb format, append 'ff' for the alpha channel
    if (hex.length === 7) {
      hex += "ff";
    }

    // Parse hexadecimal values to decimal for each color channel and alpha channel
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    const a = parseInt(hex.substring(7, 9), 16); // Alpha from 0 to 255

    // Return array with values [r, g, b, a]
    return [r, g, b, a];
  },

  getGeofencerStyle() {
    return [
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
          "line-color": "#1867c0",
          "line-dasharray": [0.2, 2],
          "line-width": 5,
        },
      },
      // polygon fill
      {
        id: "gl-draw-polygon-fill",
        type: "fill",
        filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
        paint: {
          "fill-color": "#1867c0",
          "fill-outline-color": "#1867c0",
          "fill-opacity": 0.1,
        },
      },
      // polygon mid points
      {
        id: "gl-draw-polygon-midpoint",
        type: "circle",
        filter: ["all", ["==", "$type", "Point"], ["==", "meta", "midpoint"]],
        paint: {
          "circle-radius": 5,
          "circle-color": "#1867c0",
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 2,
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
          "line-color": "#1867c0",
          "line-dasharray": [0.2, 2],
          "line-width": 5,
        },
      },
      // vertex point halos
      {
        id: "gl-draw-polygon-and-line-vertex-halo-active",
        type: "circle",
        filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
        paint: {
          "circle-radius": 5,
          "circle-color": "#1867c0",
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 2,
        },
      },
      // vertex points
      {
        id: "gl-draw-polygon-and-line-vertex-active",
        type: "circle",
        filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
        paint: {
          "circle-radius": 5,
          "circle-color": "#1867c0",
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 2,
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
          "line-color": "#1867c0",
          "line-width": 5,
        },
      },
      // polygon fill
      {
        id: "gl-draw-polygon-fill-static",
        type: "fill",
        filter: ["all", ["==", "$type", "Polygon"], ["==", "mode", "static"]],
        paint: {
          "fill-color": "#1867c0",
          "fill-outline-color": "#1867c0",
          "fill-opacity": 0.1,
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
          "line-color": "#1867c0",
          "line-width": 5,
        },
      },
    ];
  },
};
