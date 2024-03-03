const CARGOS = [
  { code: 523, name: "Bulk Carrier / Cement", color: "#D3D3D3" },
  { code: "B0", name: "Barge", color: "#8B4513" },
  { code: 764, name: "Research Vessel", color: "#ADD8E6" },
  { code: 73, name: "Pusher Tug", color: "#556B2F" },
  { code: 78, name: "Floating Structure", color: "#A9A9A9" },
  { code: 551, name: "Tanker / Bitumen and Asphalt", color: "#000000" },
  { code: 516, name: "Chemical Tanker", color: "#FFFF00" },
  { code: 50, name: "General Cargo", color: "#F5F5DC" },
  { code: 518, name: "Special Purpose Ship", color: "#000080" },
  { code: 519, name: "Ro-Ro / Container Ship", color: "#FFA500" },
  { code: 57, name: "General Cargo / Passenger", color: "#20B2AA" },
  { code: 515, name: "Barge Carrier", color: "#D2B48C" },
  { code: 761, name: "Fishing Vessel", color: "#87CEEB" },
  { code: 517, name: "Radioactive Material Ship", color: "#FF0000" },
  { code: 721, name: "Supply Ship", color: "#90EE90" },
  { code: 592, name: "Ferry", color: "#40E0D0" },
  { code: 501, name: "Bulk Carrier / Grain", color: "#F5DEB3" },
  { code: 603, name: "Salvage Ship", color: "#FFA07A" },
  { code: 543, name: "Tanker / LNG and LPG", color: "#C0C0C0" },
  { code: 80, name: "Pleasure Craft", color: "#000080" },
  { code: 593, name: "Passenger Ship", color: "#FFFFFF" },
  { code: 531, name: "Tanker / Oil Products", color: "#808080" },
  { code: 502, name: "General Cargo / Forest Products", color: "#8B4513" },
  { code: 513, name: "Vehicle Carrier", color: "#808080" },
  { code: 514, name: "Livestock Carrier", color: "#8B4513" },
  { code: 75, name: "Fishing Vessel", color: "#00008B" },
  { code: 512, name: "Ro-Ro Ship", color: "#FFFF00" },
  { code: 505, name: "General Cargo / Containers", color: "#D3D3D3" },
  { code: "B03", name: "Dry Cargo Barge", color: "#D2B48C" },
  { code: 74, name: "Dredger", color: "#808080" },
  { code: 753, name: "Fish Factory Ship", color: "#0000FF" },
  { code: 77, name: "Warship", color: "#A9A9A9" },
  { code: 591, name: "Cruise Ship", color: "#FFC0CB" },
  { code: 601, name: "Tug (no towing)", color: "#FF6347" },
  { code: 533, name: "Tanker / Chemical Tanker (Inland)", color: "#32CD32" },
  { code: 602, name: "Tug (with tow)", color: "#FF0000" },
  { code: 70, name: "Other (unspecified)", color: "#A9A9A9" },
  { code: 51, name: "Unitized Cargo", color: "#B0C4DE" },
  { code: 83, name: "Yacht", color: "#000080" },
  { code: 724, name: "Pontoon", color: "#ADFF2F" },
  { code: 541, name: "Tanker / LPG Carrier", color: "#C0C0C0" },
  { code: "B02", name: "Covered Dry Cargo Barge", color: "#D2B48C" },
  { code: 506, name: "Refrigerated Cargo", color: "#FFFFFF" },
  { code: 90, name: "Ship (unspecified)", color: "#A9A9A9" },
  { code: 711, name: "Pilot Vessel", color: "#8B0000" },
  { code: 594, name: "Passenger / Sailing Vessel", color: "#FFFFFF" },
  { code: "B01", name: "Open Dry Cargo Barge", color: "#A52A2A" },
  { code: "B04", name: "Deck Barge", color: "#8B4513" },
  { code: 511, name: "Container Ship", color: "#000080" },
  { code: 53, name: "Tanker", color: "#C0C0C0" },
  { code: 52, name: "Bulk Carrier", color: "#F5DEB3" },
  { code: "", name: "", color: "#D3D3D3" },
  { code: 54, name: "Tanker / Liquefied Gas", color: "#C0C0C0" },
];

export default {
  getShipType(code) {
    if (!code) return CARGOS[CARGOS.length - 1];

    for (let i = 0; i < CARGOS.length; i++) {
      const shipClassification = CARGOS[i];
      if (shipClassification.code == code) return shipClassification;
    }

    return CARGOS[CARGOS.length - 1];
  },

  hexToRgb(hex) {
    hex = hex.replace(/^#/, "");

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return [r, g, b];
  },
};
