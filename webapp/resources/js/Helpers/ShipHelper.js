import MapHelper from "@/Helpers/MapHelper";
import * as turf from "@turf/turf";
import proj4 from "proj4";

const ZOOM_THRESHOLD = 14;

export default {
    // Generate properties for the ship based on available data
    generateShipProperties(ship) {
        const name = ship.name ? ship.name : "N/A";
        const priority = ship.cargo_category_priority
            ? -ship.cargo_category_priority
            : 0;
        const color = ship.cargo_category_color || "#000000";

        return {
            mmsi: ship.mmsi,
            ...(name && { name }),
            ...(color && { color }),
            hdg: ship.hdg ?? 511,
            image: ship.hdg && ship.hdg !== 511 ? "shipIcon" : "circleIcon",
            priority: ship.hdg && ship.hdg !== 511 ? priority : priority * 1000,
        };
    },

    // Get UTM zone from longitude
    utmzone_from_lon(lon_deg) {
        return 1 + Math.floor((lon_deg + 180) / 6);
    },

    // Set projection definition based on longitude
    proj4_setdef(lon_deg) {
        const utm_zone = this.utmzone_from_lon(lon_deg);
        return `+proj=utm +zone=${utm_zone} +datum=WGS84 +units=m +no_defs`;
    },

    // Convert coordinates to meters
    convertCoordsToMeters(coords, target) {
        if (!coords || coords.length !== 2 || !coords.every(Number.isFinite)) {
            console.error("Invalid coordinates:", coords);
            return null;
        }

        const source = "+proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees";
        return proj4(source, target, coords);
    },

    // Convert coordinates to WGS84
    convertCoordsToWGS84(coords, source) {
        if (!coords || coords.length !== 2 || !coords.every(Number.isFinite)) {
            console.error("Invalid coordinates:", coords);
            return null;
        }

        const target = "+proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees";
        return proj4(source, target, coords);
    },

    // Calculate the centroid of a geometry
    calculateCentroid(geometry) {
        if (geometry.type === "Polygon") {
            return turf.centroid(turf.polygon(geometry.coordinates)).geometry
                .coordinates;
        } else if (geometry.type === "Point") {
            return geometry.coordinates;
        }
        return null;
    },

    // Create a collection of GeoJSON features for the ships
    createShipFeatures(ships) {
        return ships.flatMap((ship) => {
            const shipProperties = this.generateShipProperties(ship);
            const { geometry, centroid } = this.createShipGeoJson(ship);

            return [
                {
                    type: "Feature",
                    geometry: JSON.parse(ship.geojson),
                    properties: shipProperties,
                },
                {
                    type: "Feature",
                    geometry,
                    properties: {
                        mmsi: ship.mmsi,
                        color: shipProperties.color,
                        image: "skeletonIcon",
                    },
                },
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: centroid,
                    },
                    properties: {
                        mmsi: ship.mmsi,
                        name: shipProperties.name,
                        hdg: shipProperties.hdg,
                    },
                },
            ];
        });
    },

    // Update an existing feature with new data
    updateShipFeature(existingFeature, ship) {
        const updatedProperties = this.generateShipProperties(ship);
        existingFeature.properties = {
            ...existingFeature.properties,
            ...updatedProperties,
        };

        if (ship.geojson) {
            existingFeature.geometry = JSON.parse(ship.geojson);
        }

        return existingFeature;
    },

    // Create GeoJSON for the ship (skeleton or circle)
    createShipGeoJson(ship) {
        const {
            dim_a = 10,
            dim_b = 10,
            dim_c = 5,
            dim_d = 5,
            geojson,
            hdg,
        } = ship;
        const [longitude, latitude] = JSON.parse(geojson).coordinates;

        if (!isFinite(longitude) || !isFinite(latitude)) {
            console.error("Invalid longitude or latitude:", geojson);
            return { geometry: null, centroid: null };
        }

        let geometry;
        if (hdg && hdg !== 511) {
            geometry = this.createSkeletonGeoJson(
                longitude,
                latitude,
                dim_a,
                dim_b,
                dim_c,
                dim_d,
                hdg
            );
        } else {
            const radius = Math.max((dim_a + dim_b) / 2, (dim_c + dim_d) / 2);
            geometry = this.createCircleGeoJson(longitude, latitude, radius);
        }

        const centroid = this.calculateCentroid(geometry);
        return { geometry, centroid };
    },

    // Create a skeleton GeoJSON for the ship
    createSkeletonGeoJson(
        longitude,
        latitude,
        lengthA,
        lengthB,
        lengthC,
        lengthD,
        heading
    ) {
        const targetProjection = this.proj4_setdef(longitude);
        const centerInMeters = this.convertCoordsToMeters(
            [longitude, latitude],
            targetProjection
        );

        const offsets = [
            { x: -lengthC, y: -lengthB },
            { x: -lengthC, y: lengthA - (lengthA + lengthB) * 0.1 },
            { x: lengthD - (lengthC + lengthD) / 2, y: lengthA },
            { x: lengthD, y: lengthA - (lengthA + lengthB) * 0.1 },
            { x: lengthD, y: -lengthB },
            { x: -lengthC, y: -lengthB },
        ];

        const rotatedCoordinates = offsets.map(({ x, y }) => {
            const adjustedCoords = [
                centerInMeters[0] + x,
                centerInMeters[1] + y,
            ];
            return this.convertCoordsToWGS84(adjustedCoords, targetProjection);
        });

        const polygon = turf.polygon([rotatedCoordinates]);
        const rotatedPolygon = turf.transformRotate(polygon, heading, {
            pivot: [longitude, latitude],
        });

        return rotatedPolygon.geometry;
    },

    // Create a circle GeoJSON for the ship
    createCircleGeoJson(longitude, latitude, radius) {
        const circle = turf.circle([longitude, latitude], radius, {
            steps: 64,
            units: "meters",
        });
        return circle.geometry;
    },

    // Add a ship layer to the map
    addLayer(map, id, source) {
        const paintOptions = {
            "icon-color": ["get", "color"],
            "text-color": "#FF0000",
            "text-halo-color": "#fff",
            "text-halo-width": 2,
        };

        const layoutOptions = {
            "icon-rotate": ["get", "hdg"],
            "icon-rotation-alignment": "map",
            "icon-image": ["get", "image"],
            "icon-size": 0.8,
            "symbol-sort-key": ["to-number", ["get", "priority"]],
            visibility: map.getZoom() >= ZOOM_THRESHOLD ? "none" : "visible",
        };

        MapHelper.addLayer(
            map,
            id,
            source,
            "symbol",
            layoutOptions,
            paintOptions
        );

        // Add skeleton layers (polygon and line)
        this.addSkeletonLayers(map, id, source);

        // Add text layer centered on the ship
        this.addTextLayer(map, id, source);

        // Update Text HDG
        this.updateTextHdg(map, id);

        // Update layer visibility on zoom
        map.on("zoom", () => this.updateLayerVisibility(map, id));

        // Update Text HDG on rotate
        map.on("rotate", () => this.updateTextHdg(map, id));
    },

    // Add skeleton layers (polygon and line)
    addSkeletonLayers(map, id, source) {
        MapHelper.addLayer(
            map,
            `${id}-polygon-skeleton`,
            source,
            "fill",
            {
                visibility:
                    map.getZoom() >= ZOOM_THRESHOLD ? "visible" : "none",
            },
            {
                "fill-color": ["get", "color"],
                "fill-opacity": 1,
            }
        );

        MapHelper.addLayer(
            map,
            `${id}-line-skeleton`,
            source,
            "line",
            {
                visibility:
                    map.getZoom() >= ZOOM_THRESHOLD ? "visible" : "none",
                "line-cap": "round",
                "line-join": "round",
            },
            {
                "line-color": "#263238",
                "line-width": 2,
            }
        );
    },

    // Add text layer centered on the ship
    addTextLayer(map, id, source) {
        const zoom = map.getZoom();

        // Add text layer centered on the ship
        MapHelper.addLayer(
            map,
            `${id}-text-centroid`,
            source,
            "symbol",
            {
                "text-field": ["get", "name"],
                "text-font": ["Open Sans Bold"],
                "text-size": this.calculateTextSize(map),
                "text-offset": [0, 0],
                "text-rotate": ["get", "hdg"],
                "text-rotation-alignment": "map",
                "text-anchor": "center",
                "text-transform": "uppercase",
                visibility: zoom >= ZOOM_THRESHOLD ? "visible" : "none",
            },
            {
                "text-color": "#000000",
                "text-halo-color": "#fff",
                "text-halo-width": 2,
            },
            ["has", "name"]
        );
    },

    // Calculate text size based on zoom level
    calculateTextSize(map) {
        return [
            "interpolate",
            ["linear"],
            ["zoom"],
            10,
            0,
            11,
            ["*", ["^", ["-", 11, map.getZoom()], 2], ["get", "textsize"]],
            12,
            ["*", ["^", ["-", 12, map.getZoom()], 2], ["get", "textsize"]],
            13,
            ["*", ["^", ["-", 13, map.getZoom()], 2], ["get", "textsize"]],
            14,
            ["*", ["^", ["-", 14, map.getZoom()], 2], ["get", "textsize"]],
            15,
            ["*", ["^", ["-", 15, map.getZoom()], 2], ["get", "textsize"]],
            16,
            ["*", ["^", ["-", 16, map.getZoom()], 2], ["get", "textsize"]],
            17,
            ["*", ["^", ["-", 17, map.getZoom()], 2], ["get", "textsize"]],
            18,
            ["*", ["^", ["-", 18, map.getZoom()], 2], ["get", "textsize"]],
            19,
            ["*", ["^", ["-", 19, map.getZoom()], 2], ["get", "textsize"]],
            20,
            ["*", ["^", ["-", 20, map.getZoom()], 2], ["get", "textsize"]],
            21,
            ["*", ["^", ["-", 21, map.getZoom()], 2], ["get", "textsize"]],
            22,
            ["*", ["^", ["-", 22, map.getZoom()], 2], ["get", "textsize"]],
            23,
            ["*", ["^", ["-", 23, map.getZoom()], 2], ["get", "textsize"]],
            24,
            ["*", ["^", ["-", 24, map.getZoom()], 2], ["get", "textsize"]],
            25,
            ["*", ["^", ["-", 25, map.getZoom()], 2], ["get", "textsize"]],
            26,
            ["*", ["^", ["-", 26, map.getZoom()], 2], ["get", "textsize"]],
            27,
            ["*", ["^", ["-", 27, map.getZoom()], 2], ["get", "textsize"]],
            28,
            ["*", ["^", ["-", 28, map.getZoom()], 2], ["get", "textsize"]],
            29,
            ["*", ["^", ["-", 29, map.getZoom()], 2], ["get", "textsize"]],
            30,
            ["*", ["^", ["-", 30, map.getZoom()], 2], ["get", "textsize"]],
        ];
    },

    // Update layer visibility based on zoom level
    updateLayerVisibility(map, id) {
        const zoom = map.getZoom();

        // Update the visibility of the ship layer (icon and text)
        map.setLayoutProperty(
            id,
            "visibility",
            zoom >= ZOOM_THRESHOLD ? "none" : "visible"
        );

        // Update the visibility of the ship layer (skeleton and text centroid)
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
            `${id}-text-centroid`,
            "visibility",
            zoom >= ZOOM_THRESHOLD ? "visible" : "none"
        );
    },

    updateTextHdg(map, id) {
        // Get the current bearing of the map
        let bearing = map.getBearing();

        // Update the text-rotate property based on the hdg value
        map.setLayoutProperty(`${id}-text-centroid`, "text-rotate", [
            "case",
            ["all", ["has", "hdg"], ["!=", ["get", "hdg"], null]],
            [
                "case",
                ["==", ["get", "hdg"], 511], // Check if hdg is 511
                bearing, // Use the bearing of the map
                [
                    "case",
                    ["<", ["%", ["+", ["get", "hdg"], 90 + bearing], 360], 180], // Check if angle is good for legibility
                    ["+", ["%", ["+", ["get", "hdg"], 90], 360], 180], // Adjust the angle to be more legible
                    ["%", ["+", ["get", "hdg"], 90], 360], //otherwise, use the hdg value
                ],
            ],
            bearing, // Use the bearing of the map
        ]);
    },

    // Remove layers and sources from the map
    removeLayers(map, id) {
        if (map.getLayer(id)) {
            map.removeLayer(id);
            map.removeLayer(`${id}-line-skeleton`);
            map.removeLayer(`${id}-polygon-skeleton`);
            map.removeLayer(`${id}-text-centroid`);
        }
    },

    removeSource(map, id) {
        if (map.getSource(id)) {
            map.removeSource(id);
        }
    },
};
