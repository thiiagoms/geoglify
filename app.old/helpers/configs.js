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
};
