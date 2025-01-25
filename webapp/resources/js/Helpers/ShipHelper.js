import MapHelper from "@/Helpers/MapHelper";
import * as turf from "@turf/turf";

const DEFAULT_COLOR = "#51829B"; // Default color for ships

export default {
    // Generates properties for a ship feature
    generateShipProperties(ship) {
        return {
            mmsi: ship.mmsi, // Ship's MMSI (Maritime Mobile Service Identity)
            name: ship.name || "N/A", // Ship's name or "N/A" if not available
            color: ship.cargo_category_color || DEFAULT_COLOR, // Ship's color based on cargo category or default color
            hdg: ship.hdg || 511, // Ship's heading or 511 (default value for unknown heading)
            image: ship.hdg && ship.hdg !== 511 ? "shipIcon" : "circleIcon", // Icon to use based on heading
        };
    },

    // Creates a ship feature for the map
    createShipFeature(ship) {
        const shipProperties = this.generateShipProperties(ship); // Generate ship properties
        const geometry = JSON.parse(ship.geojson); // Parse the ship's GeoJSON geometry
        const centroid = this.calculateCentroid(geometry); // Calculate the centroid of the geometry

        if (!geometry || !centroid) return null; // Skip if geometry or centroid is invalid

        // Return an array of two features: one for the icon and one for the text label
        return [
            {
                type: "Feature",
                geometry,
                properties: {
                    ...shipProperties,
                    type: "icon", // Feature type for the icon
                },
            },
            {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: centroid, // Centroid coordinates for the text label
                },
                properties: {
                    name: shipProperties.name, // Ship's name for the label
                    type: "text", // Feature type for the text
                },
            },
        ];
    },

    // Calculates the centroid of a geometry
    calculateCentroid(geometry) {
        if (geometry.type === "Polygon") {
            // Use Turf.js to calculate the centroid of a polygon
            return turf.centroid(turf.polygon(geometry.coordinates)).geometry
                .coordinates;
        } else if (geometry.type === "Point") {
            // Use the coordinates directly for a point
            return geometry.coordinates;
        }
        return null; // Return null for unsupported geometry types
    },

    // Adds a ship layer to the map
    addLayer(map, id, source) {
        // Add the icon layer for ships
        MapHelper.addLayer(
            map,
            id,
            source,
            "symbol",
            {
                "icon-image": ["get", "image"], // Use the ship's icon
                "icon-size": 0.5, // Set icon size
                "icon-rotate": ["get", "hdg"], // Rotate icon based on heading
                "icon-rotation-alignment": "map", // Align rotation with the map
                "icon-allow-overlap": true, // Allow icons to overlap
            },
            {
                "icon-color": ["get", "color"], // Set icon color
            },
            ["==", ["get", "type"], "icon"] // Filter for icon features
        );

        // Add the text label layer for ships
        MapHelper.addLayer(
            map,
            `${id}-text`,
            source,
            "symbol",
            {
                "text-field": ["get", "name"], // Display the ship's name
                "text-font": ["Open Sans Bold"], // Set font
                "text-size": 16, // Set text size
                "text-anchor": "center", // Center the text
                "text-offset": [0, 0], // No offset
            },
            {
                "text-color": "#000000", // Set text color
                "text-halo-color": "#fff", // Set text halo color
                "text-halo-width": 2, // Set text halo width
            },
            ["==", ["get", "type"], "text"] // Filter for text features
        );
    },

    // Removes ship layers from the map
    removeLayers(map, id) {
        if (map.getLayer(id)) map.removeLayer(id); // Remove the icon layer
        if (map.getLayer(`${id}-text`)) map.removeLayer(`${id}-text`); // Remove the text layer
    },

    // Removes a ship source from the map
    removeSource(map, id) {
        if (map.getSource(id)) map.removeSource(id); // Remove the source if it exists
    },

    // Updates the ship source with new features
    updateSource(map, id, features) {
        console.log("updateSource", id, features); // Log the update
        MapHelper.updateSource(map, id, features); // Update the source using MapHelper
    },
};
