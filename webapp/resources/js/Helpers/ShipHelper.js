import MapHelper from "@/Helpers/MapHelper";

/**
 * Helper functions for the ships
 */
export default {

    /**
     * Update the position of the ship in the map
     * @param {*} features 
     * @param {*} ship 
     */
    updateShipPosition(features, ship) {
        // Find the ship in the features
        const feature = features.find((f) => f.properties.mmsi === ship.mmsi);

        if (!feature) {
            // Add the ship if not found
            features.push({
                type: "Feature",
                geometry: JSON.parse(ship.geojson),
                properties: {
                    mmsi: ship.mmsi,
                    name: ship.name,
                    cargo: ship.cargo,
                    hdg: ship.hdg,
                    image: !!ship.hdg && ship.hdg != 511 ? "ship" : "circle",
                    priority: !!ship.hdg && ship.hdg != 511 ? 100 : 0,
                },
            });
        } else {
            // Update the existing feature and its properties
            feature.geometry = JSON.parse(ship.geojson);
            feature.properties.hdg = ship.hdg ?? 0;
            feature.properties.cargo = ship.cargo;
            feature.properties.name = ship.name;
            feature.properties.image = !!ship.hdg && ship.hdg != 511 ? "ship" : "circle";
            feature.properties.priority = !!ship.hdg && ship.hdg != 511 ? 100 : 0;
        }
    },

    /**
     * Create a feature collection for the ships
     * @param {*} ships 
     * @returns 
     */
    createShipFeatures(ships) {

        return ships.map((ship) => {
            return {
                type: "Feature",
                geometry: JSON.parse(ship.geojson),
                properties: {
                    mmsi: ship.mmsi,
                    name: ship.name,
                    cargo: ship.cargo,
                    hdg: ship.hdg ?? 0,
                    image: !!ship.hdg && ship.hdg != 511 ? "ship" : "circle",
                    priority: !!ship.hdg && ship.hdg != 511 ? 100 : 0,
                },
            };
        });
    },

    /**
     * Add a ship layer to the map
     * @param {*} map 
     * @param {*} id 
     * @param {*} source 
     */
    addLayer(map, id, source) {
        
        const layoutOptions = {
            "icon-rotate": ["get", "hdg"],
            "icon-rotation-alignment": "map",
            "icon-image":  ["get", "image"],
            "icon-allow-overlap": true,
            "icon-size": 0.8,
            "text-field": ["get", "name"],
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            "text-size": 11,
            "text-transform": "uppercase",
            "text-letter-spacing": 0.05,
            "text-offset": [0, 1.5],
            'symbol-sort-key': ['-', ['get', 'priority']]
        };

        const paintOptions = {
        };

        MapHelper.addLayer(map, id, source, "symbol", layoutOptions, paintOptions);
    },
};
