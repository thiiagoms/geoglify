// Description: Helper functions to process the data and configurations.

// Import the required libraries
import * as turf from "@turf/turf";
import proj4 from "proj4";

// Import the data files
import CARGOS from "./assets/cargos.json";
import COUNTRIES from "./assets/countries.json";

// Projection used to convert coordinates from WGS84 to meters
const METER_PROJECTION = `PROJCS["WGS 84 / Pseudo-Mercator",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]],PROJECTION["Mercator_1SP"],PARAMETER["central_meridian",0],PARAMETER["scale_factor",1],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["X",EAST],AXIS["Y",NORTH],EXTENSION["PROJ4","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs"],AUTHORITY["EPSG","3857"]]`;

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
          isActive: true,
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
  hexToRgb(hex) {
    hex = hex.replace(/^#/, "");

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return [r, g, b];
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

  processGeoJSON(ship) {
    try {
      const [x, y] = ship.location.coordinates;
      const hdg = ship?.hdg;

      let geojson;

      if (!hdg || hdg === 511) {
        // If the ship has no heading or the heading is invalid, create a circle
        const length = (ship?.dimA || 0) + (ship?.dimB || 0) || ship.length || 10;
        const width = (ship?.dimC || 0) + (ship?.dimD || 0) || ship.width || 10;

        // Calculate the radius of the circle
        const radius = Math.max(width, length) / 2;
        let circle = turf.circle([x, y], radius, { units: "meters" });

        // Simplify the circle to reduce the number of points
        var options = { tolerance: 0.000001, highQuality: true };
        circle = turf.simplify(circle, options);

        // Create a small circle to represent the antenna
        let antenna = turf.circle([x, y], 0.2, { units: "meters" });
        var options = { tolerance: 0.0000001, highQuality: true };
        antenna = turf.simplify(antenna, options);

        // Create a GeoJSON polygon with the circle and the antenna
        geojson = turf.polygon([circle.geometry.coordinates[0], antenna.geometry.coordinates[0]]);
      } else {
        // If the ship has a valid heading, create a ship icon
        const length = (ship?.dimA || 0) + (ship?.dimB || 0) || ship.length || 30;
        const width = (ship?.dimC || 0) + (ship?.dimD || 0) || ship.width || 8;

        // Calculate the offset of the ship's dimensions
        const xOffsetA = ship?.dimA || length / 2;
        const xOffsetB = ship?.dimB || length / 2;
        const yOffsetC = ship?.dimC || width / 2;
        const yOffsetD = ship?.dimD || width / 2;

        // Calculate the center of the ship in meters
        const center = this.convertCoordsToMeters([x, y]);

        // Calculate the four points of the ship in meters
        let pointAC = this.convertCoordsToWGS84([center[0] - yOffsetC, center[1] + Math.max(xOffsetA * 0.8, 2)]);
        let pointE = this.convertCoordsToWGS84([center[0] + (yOffsetD - yOffsetC) / 2, center[1] + xOffsetA]);
        let pointAD = this.convertCoordsToWGS84([center[0] + yOffsetD, center[1] + Math.max(xOffsetA * 0.8, 2)]);
        let pointBD = this.convertCoordsToWGS84([center[0] + yOffsetD, center[1] - xOffsetB]);
        let pointBC = this.convertCoordsToWGS84([center[0] - yOffsetC, center[1] - xOffsetB]);

        // Rotate the four points of the ship
        let rotatePointAC = this.rotateCoords(pointAC, hdg, [x, y]);
        let rotatePointE = this.rotateCoords(pointE, hdg, [x, y]);
        let rotatePointAD = this.rotateCoords(pointAD, hdg, [x, y]);
        let rotatePointBD = this.rotateCoords(pointBD, hdg, [x, y]);
        let rotatePointBC = this.rotateCoords(pointBC, hdg, [x, y]);

        // Create a small circle to represent the antenna
        let antenna = turf.circle([x, y], 0.2, { units: "meters" });
        var options = { tolerance: 0.0000001, highQuality: true };
        antenna = turf.simplify(antenna, options);

        // Create a GeoJSON polygon with the four rotated points
        geojson = turf.polygon([[rotatePointAC, rotatePointE, rotatePointAD, rotatePointBD, rotatePointBC, rotatePointAC], antenna.geometry.coordinates[0]]);
      }

      // Add properties to the GeoJSON
      geojson.properties = {
        color: ship.color,
        _id: ship._id,
      };

      return geojson;
    } catch (error) {
      console.log("Error procesando GeoJSON", error.message);
      return;
    }
  },

  // Convert coordinates from WGS84 to meters
  convertCoordsToMeters(coords) {
    return proj4(METER_PROJECTION, coords);
  },

  // Convert coordinates from meters to WGS84
  convertCoordsToWGS84(coords) {
    return proj4(METER_PROJECTION, "+proj=longlat +datum=WGS84 +no_defs", coords);
  },

  // Rotate coordinates around a center point
  rotateCoords(latlonPoint, angleDeg, latlonCenter) {
    var point = turf.point(latlonPoint);
    var options = { pivot: latlonCenter };
    var rotatedPoint = turf.transformRotate(point, angleDeg, options);
    return rotatedPoint.geometry.coordinates;
  },

  getMapDrawStyles() {
    return [
      {
        id: "highlight-active-points",
        type: "circle",
        filter: ["all", ["==", "$type", "Point"], ["==", "meta", "feature"], ["==", "active", "true"]],
        paint: {
          "circle-radius": 4,
          "circle-stroke-color": "#FFF",
          "circle-stroke-width": 2,
          "circle-color": "#D20C0C",
        },
      },
      {
        id: "points-are-blue",
        type: "circle",
        filter: ["all", ["==", "$type", "Point"], ["==", "meta", "feature"], ["==", "active", "false"]],
        paint: {
          "circle-radius": 5,
          "circle-color": "#D20C0C",
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
          "line-color": "#D20C0C",
          "line-dasharray": [0.2, 2],
          "line-width": 2,
        },
      },
      // polygon fill
      {
        id: "gl-draw-polygon-fill",
        type: "fill",
        filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
        paint: {
          "fill-color": "#D20C0C",
          "fill-outline-color": "#D20C0C",
          "fill-opacity": 0.1,
        },
      },
      // polygon mid points
      {
        id: "gl-draw-polygon-midpoint",
        type: "circle",
        filter: ["all", ["==", "$type", "Point"], ["==", "meta", "midpoint"]],
        paint: {
          "circle-radius": 4,
          "circle-stroke-color": "#FFF",
          "circle-stroke-width": 2,
          "circle-color": "#D20C0C",
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
          "line-color": "#D20C0C",
          "line-dasharray": [0.2, 2],
          "line-width": 2,
        },
      },
      // vertex point halos
      {
        id: "gl-draw-polygon-and-line-vertex-halo-active",
        type: "circle",
        filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
        paint: {
          "circle-radius": 5,
          "circle-color": "#FFF",
        },
      },
      // vertex points
      {
        id: "gl-draw-polygon-and-line-vertex-active",
        type: "circle",
        filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
        paint: {
          "circle-radius": 3,
          "circle-color": "#D20C0C",
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
          "line-width": 3,
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
          "line-width": 3,
        },
      },
    ];
  },

  getMeasuresOptions() {
    return {
      lang: {
        areaMeasurementButtonTitle: "Measure area",
        lengthMeasurementButtonTitle: "Measure length",
        clearMeasurementsButtonTitle: "Clear measurements",
      },
      units: "metric", //or metric, the default
      unitsGroupingSeparator: " ", // optional. use a space instead of ',' for separating thousands (3 digits group). Do not send this to use the browser default
      style: {
        text: {
          radialOffset: 0.9,
          letterSpacing: 0.05,
          color: "#D20C0C",
          haloColor: "#fff",
          haloWidth: 0,
          font: "Nunito",
        },
        common: {
          midPointRadius: 3,
          midPointColor: "#D20C0C",
          midPointHaloRadius: 5,
          midPointHaloColor: "#FFF",
        },
        areaMeasurement: {
          fillColor: "#D20C0C",
          fillOutlineColor: "#D20C0C",
          fillOpacity: 0.01,
          lineWidth: 2,
        },
        lengthMeasurement: {
          lineWidth: 2,
          lineColor: "#D20C0C",
        },
      },
    };
  },
};
