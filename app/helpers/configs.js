const CARGOS = [
  {
    id: 1,
    code: [30],
    color: "#fa7f7f",
    name: "Fishing",
  },
  {
    id: 4,
    code: [60, 61, 62, 63, 64, 65, 66, 67, 68, 69],
    color: "#00A9FF",
    name: "Passenger",
  },
  {
    id: 5,
    code: [70, 71, 72, 73, 74, 75, 76, 77, 78, 79],
    color: "#FF5733",
    name: "Cargo",
  },
  {
    id: 6,
    code: [80, 81, 82, 83, 84, 85, 86, 87, 88, 89],
    color: "#ffe127",
    name: "Tanker",
  },
  {
    id: 3,
    code: [36, 37],
    color: "#66C547",
    name: "Pleasure Craft",
  },
  {
    id: 2,
    code: [31, 52, 32, 33, 34, 35, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 50, 51, 53, 54, 55, 56, 57, 58, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49],
    color: "#b2e32b",
    name: "Special",
  },
  {
    id: 7,
    code: [0, 59, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 38, 39],
    color: "#d2d5da",
    name: "Other",
    priority: -500,
  },
];

export default {
  getShipType(code) {
    if (!code) return CARGOS[CARGOS.length - 1];

    for (let i = 0; i < CARGOS.length; i++) {
      const shipClassification = CARGOS[i];
      if (shipClassification) {
        for (let j = 0; j < shipClassification.code.length; j++) {
          const shipClassifCode = shipClassification.code[j];
          if (shipClassifCode === code) {
            return shipClassification;
          }
        }
      }
    }

    return CARGOS[CARGOS.length - 1];
  },

  getCargos() {
    return CARGOS;
  },

  hexToRgb(hex) {
    hex = hex.replace(/^#/, "");

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return [r, g, b];
  },
};