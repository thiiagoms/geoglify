import MapHelper from "@/Helpers/MapHelper";

/**
 * Helper functions for the ships
 */
export default {
    /**
     * Remove <em> tags from a string
     * @param {string} str
     * @returns {string}
     */
    removeEmTags(str) {
        return str.replace(/<\/?em>/g, "");
    },

    /**
     * Update the position of the ship in the map
     * @param {*} features
     * @param {*} ship
     */
    updateShipPosition(features, ship) {
        // Find the ship in the features
        const feature = features.find((f) => f.properties.mmsi === ship.mmsi);

        // Remove <em> tags from ship properties
        const name = ship.name ? this.removeEmTags(ship.name) : undefined;
        const cargo = ship.cargo ? this.removeEmTags(ship.cargo) : undefined;

        if (!feature) {
            // Add the ship if not found
            features.push({
                type: "Feature",
                geometry: JSON.parse(ship.geojson),
                properties: {
                    mmsi: ship.mmsi,
                    ...(name && { name }),
                    ...(cargo && { cargo }),
                    ...(ship.hdg !== undefined && { hdg: ship.hdg }),
                    ...(ship.hdg && ship.hdg != 511
                        ? { image: "ship", priority: 100 }
                        : { image: "circle", priority: 0 }),
                },
            });
        } else {
            // Update the existing feature and its properties
            feature.geometry = JSON.parse(ship.geojson);
            feature.properties = {
                ...feature.properties,
                ...(ship.hdg !== undefined && { hdg: ship.hdg }),
                ...(cargo && { cargo }),
                ...(name && { name }),
                ...(ship.hdg && ship.hdg != 511
                    ? { image: "ship", priority: 100 }
                    : { image: "circle", priority: 0 }),
            };
        }
    },

    /**
     * Create a feature collection for the ships
     * @param {*} ships
     * @returns
     */
    createShipFeatures(ships) {
        return ships.map((ship) => {
            // Remove <em> tags from ship properties
            const name = ship.name ? this.removeEmTags(ship.name) : undefined;
            const cargo = ship.cargo
                ? this.removeEmTags(ship.cargo)
                : undefined;

            const properties = {
                mmsi: ship.mmsi,
                ...(name && { name }),
                ...(cargo && { cargo }),
                ...(ship.hdg !== undefined && { hdg: ship.hdg }),
                ...(ship.hdg && ship.hdg != 511
                    ? { image: "ship", priority: 100 }
                    : { image: "circle", priority: 0 }),
            };

            return {
                type: "Feature",
                geometry: JSON.parse(ship.geojson),
                properties,
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
            "icon-image": ["get", "image"],
            "icon-allow-overlap": true,
            "icon-size": 0.8,
            "text-field": ["get", "name"],
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            "text-size": 11,
            "text-transform": "uppercase",
            "text-letter-spacing": 0.05,
            "text-offset": [0, 1.5],
            "symbol-sort-key": ["-", ["get", "priority"]],
        };

        const paintOptions = {};

        MapHelper.addLayer(
            map,
            id,
            source,
            "symbol",
            layoutOptions,
            paintOptions
        );
    },
};
