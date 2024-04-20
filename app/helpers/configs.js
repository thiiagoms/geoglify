import CARGOS from "./assets/cargos.json";
import COUNTRIES from "./assets/countries.json";

export default {
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
      categorizedCargos.get(category).priority = Math.max(
        categorizedCargos.get(category).priority || 0,
        cargo.priority
      );
    });

    return categorizedCargos;
  },

  getCargos() {
    return CARGOS;
  },

  getCargoType(code) {
    return CARGOS.find((cargo) => cargo.code === code) || CARGOS[0];
  },

  hexToRgb(hex) {
    hex = hex.replace(/^#/, "");

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return [r, g, b];
  },

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

  getBaseMaps()
  {
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
  }
};
