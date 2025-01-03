import MapHelper from "@/Helpers/MapHelper";
import * as turf from "@turf/turf";
import proj4 from "proj4";

const ZOOM_THRESHOLD = 14;

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
        return str.replace(/<\/?em>/g, "");
    },

    /**
     * Generate properties for the ship based on available data
     * @param {Object} ship - The ship data object
     * @returns {Object} - The properties to be used in GeoJSON for the ship
     */
    generateShipProperties(ship) {
        const name = ship.name ? this.removeEmTags(ship.name) : "N/A";

        const priority = ship.cargo_category_priority
            ? -ship.cargo_category_priority
            : 0;

        const color = ship.cargo_category_color
            ? ship.cargo_category_color
            : "#000000";

        return {
            mmsi: ship.mmsi,
            route: ship.route,
            ...(name && { name }),
            ...(color && { color }),
            ...(ship.hdg !== undefined && { hdg: ship.hdg }),
            ...(ship.hdg && ship.hdg != 511
                ? { image: "shipIcon", priority: priority }
                : { image: "circleIcon", priority: priority * 1000 }),
        };
    },

    /**
     * Get UTM zone from longitude
     * @param {number} lon_deg - Longitude in degrees
     * @returns {number} - UTM zone
     */
    utmzone_from_lon(lon_deg) {
        return 1 + Math.floor((lon_deg + 180) / 6);
    },

    /**
     * Set projection definition based on longitude
     * @param {number} lon_deg - Longitude in degrees
     * @returns {string} - Projection definition
     */
    proj4_setdef(lon_deg) {
        const utm_zone = this.utmzone_from_lon(lon_deg);
        return `+proj=utm +zone=${utm_zone} +datum=WGS84 +units=m +no_defs`;
    },

    /**
     * Convert coordinates to meters
     * @param {Array} coords - Coordinates [longitude, latitude]
     * @param {string} target - Target projection
     * @returns {Array|null} - Converted coordinates or null if invalid
     */
    convertCoordsToMeters(coords, target) {
        if (!coords || !Array.isArray(coords) || coords.length !== 2) {
            console.error("Invalid coordinates:", coords);
            return null;
        }

        const [longitude, latitude] = coords;

        if (!isFinite(longitude) || !isFinite(latitude)) {
            console.error("Invalid longitude or latitude:", coords);
            return null;
        }

        const source =
            "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees";

        return proj4(source, target, coords);
    },

    /**
     * Convert coordinates to WGS84
     * @param {Array} coords - Coordinates [x, y]
     * @param {string} source - Source projection
     * @returns {Array|null} - Converted coordinates or null if invalid
     */
    convertCoordsToWGS84(coords, source) {
        if (!coords || !Array.isArray(coords) || coords.length !== 2) {
            console.error("Invalid coordinates:", coords);
            return null;
        }

        const [x, y] = coords;

        if (!isFinite(x) || !isFinite(y)) {
            console.error("Invalid x or y:", coords);
            return null;
        }

        const target =
            "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees";

        return proj4(source, target, coords);
    },

    /**
     * Create a feature collection for the ships
     * @param {Array} ships - Array of ship objects
     * @returns {Array} - An array of GeoJSON features for the ships
     */
    createShipFeatures(ships) {
        return ships
            .map((ship) => {
                const shipProperties = this.generateShipProperties(ship);
                const geojsonSkeleton = this.createShipGeoJson(ship);

                return [
                    {
                        type: "Feature",
                        geometry: JSON.parse(ship.geojson),
                        properties: shipProperties,
                    },
                    {
                        type: "Feature",
                        geometry: geojsonSkeleton,
                        properties: {
                            mmsi: ship.mmsi,
                            color: shipProperties.color,
                            image: "skeletonIcon",
                        },
                    },
                ];
            })
            .flat();
    },

    /**
     * Update an existing ship feature with new data
     * @param {Object} existingFeature - Existing GeoJSON feature of the ship
     * @param {Object} ship - Updated ship data
     * @returns {Object} - Updated GeoJSON feature
     */
    updateShipFeature(existingFeature, ship) {
        const updatedProperties = this.generateShipProperties(ship);

        // Update properties and geometry if needed
        existingFeature.properties = {
            ...existingFeature.properties,
            ...updatedProperties,
        };

        if (ship.geojson) {
            existingFeature.geometry = JSON.parse(ship.geojson);
        }

        return existingFeature;
    },

    createShipGeoJson(ship) {
        let { dim_a, dim_b, dim_c, dim_d, geojson, hdg } = ship;

        if (!geojson) {
            return null;
        }

        //if dim_a, dim_b, dim_c, dim_d is missing, return dim_a = 50, dim_b = 50, dim_c = 10, dim_d = 10
        if (!dim_a && !dim_b && !dim_c && !dim_d) {
            dim_a = 10;
            dim_b = 10;
            dim_c = 5;
            dim_d = 5;
        }

        const [longitude, latitude] = JSON.parse(geojson).coordinates;

        if (hdg && hdg !== 511) {
            return this.createSkeletonGeoJson(
                longitude,
                latitude,
                dim_a,
                dim_b,
                dim_c,
                dim_d,
                hdg
            );
        } else {
            let radius = Math.max((dim_a + dim_b) / 2, (dim_c, dim_d) / 2);
            return this.createCircleGeoJson(longitude, latitude, radius);
        }
    },

    /**
     * Create a skeleton GeoJSON feature
     * @param {number} longitude - Longitude
     * @param {number} latitude - Latitude
     * @param {number} lengthA - Length A
     * @param {number} lengthB - Length B
     * @param {number} lengthC - Length C
     * @param {number} lengthD - Length D
     * @param {number} heading - Heading
     * @returns {Object} - GeoJSON geometry
     */
    createSkeletonGeoJson(
        longitude,
        latitude,
        lengthA,
        lengthB,
        lengthC,
        lengthD,
        heading
    ) {
        // Set the target projection based on the longitude
        const targetProjection = this.proj4_setdef(longitude);

        // Calculate a threshold and center middle for further offset calculations
        const threshold = (lengthA + lengthB) * 0.1;
        const centerMiddle = (lengthC + lengthD) / 2;

        // Define offsets for the skeleton vertices
        const offsets = [
            { x: -lengthC, y: -lengthB },
            { x: -lengthC, y: lengthA - threshold },
            { x: lengthD - centerMiddle, y: lengthA },
            { x: lengthD, y: lengthA - threshold },
            { x: lengthD, y: -lengthB },
            { x: -lengthC, y: -lengthB },
        ];

        // Convert the geographic coordinates to meters
        const centerInMeters = this.convertCoordsToMeters(
            [longitude, latitude],
            targetProjection
        );

        // Translate and rotate the coordinates based on the offsets
        const rotatedCoordinates = offsets.map(({ x, y }) => {
            const adjustedCoordinatesInMeters = [
                centerInMeters[0] + x,
                centerInMeters[1] + y,
            ];

            // Convert back to geographic coordinates (WGS84)
            return this.convertCoordsToWGS84(
                adjustedCoordinatesInMeters,
                targetProjection
            );
        });

        // Create a polygon using the rotated coordinates
        const polygon = turf.polygon([rotatedCoordinates]);

        // Rotate the polygon according to the heading
        const options = { pivot: [longitude, latitude] };
        const rotatedPolygon = turf.transformRotate(polygon, heading, options);

        return rotatedPolygon.geometry;
    },

    /**
     * Create a circle GeoJSON feature
     * @param {number} longitude - Longitude
     * @param {number} latitude - Latitude
     * @param {number} radius - Radius in meters
     * @returns {Object} - GeoJSON geometry
     */
    createCircleGeoJson(longitude, latitude, radius) {
        const center = [longitude, latitude];
        const options = { steps: 64, units: "meters" };
        const circle = turf.circle(center, radius, options);
        return circle.geometry;
    },

    /**
     * Add a layer for ships with skeletons around each ship's position
     * @param {Object} map - The Map instance
     * @param {string} id - The layer ID
     * @param {Object} source - The data source for the ships
     */
    addLayer(map, id, source) {
        const paintOptions = {
            "icon-color": ["get", "color"],
        };

        const layoutOptions = {
            "icon-rotate": ["get", "hdg"],
            "icon-rotation-alignment": "map",
            "icon-image": ["get", "image"],
            "icon-allow-overlap": false,
            "icon-size": 0.9,
            "icon-overlap": "always",
            "text-field": ["get", "name"],
            "text-font": ["Open Sans Bold"],
            "text-size": 12,
            "text-offset": [0, 1],
            "text-transform": "uppercase",
            "text-letter-spacing": 0.05,
            "symbol-sort-key": ["to-number", ["get", "priority"]],
            visibility: map.getZoom() > ZOOM_THRESHOLD ? "none" : "visible",
        };

        const zoom = map.getZoom();

        MapHelper.addLayer(
            map,
            id,
            source,
            "symbol",
            layoutOptions,
            paintOptions
        );

        const skeletonFillLayoutOptions = {
            visibility: zoom >= ZOOM_THRESHOLD ? "visible" : "none",
        };

        const skeletonLineLayoutOptions = {
            visibility: zoom >= ZOOM_THRESHOLD ? "visible" : "none",
            "line-cap": "round",
            "line-join": "round",
        };

        const skeletonPaintOptions = {
            "fill-color": ["get", "color"],
            "fill-opacity": 1,
        };

        // Add a polygon skeleton around each ship
        MapHelper.addLayer(
            map,
            `${id}-polygon-skeleton`,
            source,
            "fill",
            skeletonFillLayoutOptions,
            skeletonPaintOptions
        );

        // Add a line skeleton around each ship
        MapHelper.addLayer(
            map,
            `${id}-line-skeleton`,
            source,
            "line",
            skeletonLineLayoutOptions,
            {
                "line-color": "#000000",
                "line-width": 1,
            }
        );

        // Add a text label for each ship
        MapHelper.addLayer(
            map,
            `${id}-text`,
            source,
            "symbol",
            {
                "text-field": ["get", "name"],
                "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                "text-size": 12,
                "text-offset": [0, 1],
                "text-transform": "uppercase",
                "text-letter-spacing": 0.05,
                "symbol-sort-key": ["to-number", ["get", "priority"]],
                visibility: map.getZoom() > ZOOM_THRESHOLD ? "visible" : "none",
            },
            {
                "text-color": "#000000",
            }
        );
        
        map.on("click", `${id}`, (e) => {
            const ship = e.features[0].properties; // Gets the properties of the clicked ship
            this.$emit("ship-clicked", ship.mmsi); // Emits an event with the ship's 'mmsi'
        });
        
        // Initializes the click listener for ship selection
        map.on("click", `${id}-polygon-skeleton`, (e) => {
            const ship = e.features[0].properties; // Gets the properties of the clicked ship
            this.$emit("ship-clicked", ship.mmsi); // Emits an event with the ship's 'mmsi'
        });
        
        // Change the cursor to a pointer when the mouse is over the ship layer
        map.on("mouseenter", `${id}`, () => {
            this.mapInstance.getCanvas().style.cursor = "pointer";
        });
        
        // Change the cursor back to the default when the mouse leaves the ship layer
        map.on("mouseleave", `${id}`, () => {
            this.mapInstance.getCanvas().style.cursor = "";
        });                            

        // Update the visibility of the layers based on the zoom level
        map.on("zoom", () => {
            const zoom = map.getZoom();

            map.setLayoutProperty(
                id,
                "visibility",
                zoom > ZOOM_THRESHOLD ? "none" : "visible"
            );

            map.setLayoutProperty(
                `${id}-polygon-skeleton`,
                "visibility",
                zoom >= ZOOM_THRESHOLD ? "visible" : "none"
            );

            map.setLayoutProperty(
                `${id}-line-skeleton`,
                "visibility",
                zoom >= ZOOM_THRESHOLD ? "visible" : "none"
            );

            map.setLayoutProperty(
                `${id}-text`,
                "visibility",
                zoom > ZOOM_THRESHOLD ? "visible" : "none"
            );
        });
    },

    /**
     * Remove a layer and its source from the map
     * @param {Object} map - The Map instance
     * @param {string} id - The layer ID
     */
    removeLayers(map, id) {
        // Check if the layer exists
        if (!map.getLayer(id)) {
            return;
        }

        // Remove the main layer and the skeleton layer
        map.removeLayer(id);
        map.removeLayer(`${id}-line-skeleton`);
        map.removeLayer(`${id}-polygon-skeleton`);
        map.removeLayer(`${id}-text`);
    },

    /**
     * Remove a source from the map
     * @param {*} map
     * @param {*} id
     */
    removeSource(map, id) {
        // Check if the source exists
        if (!map.getSource(id)) {
            return;
        }

        // Remove the source
        map.removeSource(id);
    },
};
