import MapHelper from "@/Helpers/MapHelper";

/**
 * Helper functions for the ships
 */
export default {
    /**
     * Remove <em> tags from a string
     * @param {string} str - The string to process
     * @returns {string} - The string without <em> tags
     */
    removeEmTags(str) {
        return str.replace("/</?em>/g", "");
    },

    /**
     * Generate properties for the ship based on available data
     * @param {Object} ship - The ship data object
     * @returns {Object} - The properties to be used in GeoJSON for the ship
     */
    generateShipProperties(ship) {
        // Clean up <em> tags from name and cargo
        const name = ship.name ? this.removeEmTags(ship.name) : undefined;
        const cargo = ship.cargo ? this.removeEmTags(ship.cargo) : undefined;

        return {
            mmsi: ship.mmsi,
            route: ship.route,
            ...(name && { name }), // Only include name if it exists
            ...(cargo && { cargo }), // Only include cargo if it exists
            ...(ship.hdg !== undefined && { hdg: ship.hdg }), // Only include hdg if it exists
            // Set icon and priority based on heading
            ...(ship.hdg && ship.hdg != 511
                ? { image: "shipIcon", priority: 100 }
                : { image: "circleIcon", priority: 0 }),
        };
    },

    /**
     * Update the position of the ship in the map
     * @param {*} features - The list of current features
     * @param {*} ship - The ship data
     */
    updateShipPosition(features, ship) {
        // Generate the properties once using the helper function
        const shipProperties = this.generateShipProperties(ship);

        // Calculate the square geometry around the ship's position (1 meter approx)
        const geojsonSquare = this.createSquareGeoJson(ship);

        // Find the existing feature for the ship in the map
        const feature = features.find((f) => f.properties.mmsi === ship.mmsi);

        if (!feature) {
            // If the feature doesn't exist, create a new one and add the ship
            features.push({
                type: "Feature",
                geometry: JSON.parse(ship.geojson),
                properties: shipProperties,
            });

            // Add the square around the ship's position
            features.push({
                type: "Feature",
                geometry: geojsonSquare,
                properties: {
                    mmsi: ship.mmsi,
                    image: "squareIcon",
                    priority: 50,
                },
            });
        } else {
            // If the feature exists, update its geometry and properties
            feature.geometry = JSON.parse(ship.geojson);
            feature.properties = { ...feature.properties, ...shipProperties };

            // Update the square geometry
            const squareFeature = features.find(
                (f) =>
                    f.properties.mmsi === ship.mmsi &&
                    f.properties.image === "squareIcon"
            );
            if (squareFeature) {
                squareFeature.geometry = geojsonSquare;
            } else {
                // If square does not exist, add it
                features.push({
                    type: "Feature",
                    geometry: geojsonSquare,
                    properties: {
                        mmsi: ship.mmsi,
                        image: "squareIcon",
                        priority: 50,
                    },
                });
            }
        }
    },

    /**
     * Convert a distance in meters to a degree of latitude
     * @param {number} meters - The distance in meters
     * @returns {number} - The equivalent distance in degrees of latitude
     */
    metersToLatitude(meters) {
        return meters / 111320; // 1 degree of latitude is approximately 111320 meters
    },

    /**
     * Convert a distance in meters to a degree of longitude
     * @param {number} meters - The distance in meters
     * @param {number} latitude - The current latitude
     * @returns {number} - The equivalent distance in degrees of longitude
     */
    metersToLongitude(meters, latitude) {
        const longitudeDegreeLength = 40008000 / 360; // meters per degree of longitude
        return (
            meters /
            (longitudeDegreeLength * Math.cos((latitude * Math.PI) / 180))
        );
    },

    /**
     * Create a bounding box GeoJSON around the ship using AIS dimensions
     * @param {Object} ship - The ship data (with geojson and dimensions A, B, C, D)
     * @returns {Object} - The GeoJSON object for the ship's bounding area (rectangle)
     */
    createSquareGeoJson(ship) {
        const position = JSON.parse(ship.geojson).coordinates;
        const lat = position[1];
        const lng = position[0];
        const dimA = ship.dimA || 0; // Distance from the center to the bow (in meters)
        const dimB = ship.dimB || 0; // Distance from the center to the port side (in meters)
        const dimC = ship.dimC || 0; // Distance from the center to the stern (in meters)
        const dimD = ship.dimD || 0; // Distance from the center to the starboard side (in meters)

        // Convert dimensions to latitude/longitude displacements
        const latDisplacementA = this.metersToLatitude(dimA); // Displacement in latitude for dimA (bow)
        const latDisplacementC = this.metersToLatitude(dimC); // Displacement in latitude for dimC (stern)
        const lngDisplacementB = this.metersToLongitude(dimB, lat); // Displacement in longitude for dimB (port side)
        const lngDisplacementD = this.metersToLongitude(dimD, lat); // Displacement in longitude for dimD (starboard side)

        // Calculate the 4 corners of the bounding box
        const points = [
            [lng - lngDisplacementB, lat + latDisplacementA], // Top-left (bow-left corner)
            [lng + lngDisplacementD, lat + latDisplacementA], // Top-right (bow-right corner)
            [lng + lngDisplacementD, lat - latDisplacementC], // Bottom-right (stern-right corner)
            [lng - lngDisplacementB, lat - latDisplacementC], // Bottom-left (stern-left corner)
        ];

        // Close the polygon by adding the first point at the end
        points.push(points[0]);

        // Return the GeoJSON for the bounding box
        return {
            type: "Polygon",
            coordinates: [points],
        };
    },

    /**
     * Create a feature collection for the ships
     * @param {*} ships - Array of ship objects
     * @returns {Array} - An array of GeoJSON features for the ships
     */
    createShipFeatures(ships) {
        return ships
            .map((ship) => {
                // Generate properties for the ship
                const shipProperties = this.generateShipProperties(ship);

                // Calculate square geometry around the ship's position (1 meter approx)
                const geojsonSquare = this.createSquareGeoJson(ship);

                return [
                    {
                        type: "Feature",
                        geometry: JSON.parse(ship.geojson),
                        properties: shipProperties,
                    },
                    {
                        type: "Feature",
                        geometry: geojsonSquare,
                        properties: {
                            mmsi: ship.mmsi,
                            image: "squareIcon",
                            priority: 50,
                        },
                    },
                ];
            })
            .flat();
    },

    /**
     * Update a feature collection with new or updated ships
     * @param {*} currentFeatures - The existing feature collection
     * @param {*} newFeatures - The new features to be added/updated
     * @returns {Array} - The updated feature collection
     */
    updateShipFeatures(currentFeatures, newFeatures) {
        newFeatures.forEach((newFeature) => {
            const existingFeatureIndex = currentFeatures.findIndex(
                (feature) =>
                    feature.properties.mmsi === newFeature.properties.mmsi
            );

            if (existingFeatureIndex !== -1) {
                // If feature exists, replace it
                currentFeatures[existingFeatureIndex] = newFeature;
            } else {
                // If not, add the new feature
                currentFeatures.push(newFeature);
            }
        });

        return currentFeatures;
    },

    /**
     * Add a layer for ships with squares around each ship's position
     * @param {*} map - The Map instance
     * @param {*} id - The layer ID
     * @param {*} source - The data source for the ships
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

        // Add ship icon layer
        MapHelper.addLayer(
            map,
            id,
            source,
            "symbol",
            layoutOptions,
            paintOptions
        );

        // Add square layer for ship positions
        const squareLayoutOptions = {
            visibility: "none", // Initially set as invisible
        };

        const squarePaintOptions = {
            "fill-color": "#FF0000", // Red square color
            "fill-opacity": 0.3, // Square opacity
        };

        MapHelper.addLayer(
            map,
            `${id}-square`,
            source,
            "fill",
            squareLayoutOptions,
            squarePaintOptions
        );

        // Control the visibility of layers based on zoom level
        map.on("zoom", () => {
            const zoom = map.getZoom();

            // Ship icons: Toggle visibility based on zoom level
            map.setLayoutProperty(
                id,
                "visibility",
                zoom > 16 ? "none" : "visible"
            );

            // Squares: Toggle visibility based on zoom level
            map.setLayoutProperty(
                `${id}-square`,
                "visibility",
                zoom >= 16 ? "visible" : "none"
            );
        });
    },
};
