import maplibregl from "maplibre-gl"; // Import Maplibre GL library
import MapboxDraw from "@mapbox/mapbox-gl-draw"; // Import Mapbox Draw library

// Override Mapbox Draw constants to use Maplibre GL classes
MapboxDraw.constants.classes.CONTROL_BASE = "maplibregl-ctrl";
MapboxDraw.constants.classes.CONTROL_PREFIX = "maplibregl-ctrl-";
MapboxDraw.constants.classes.CONTROL_GROUP = "maplibregl-ctrl-group";

/**
 * Map helper functions
 */
export default {
    // Create a new map instance
    createMap(container, center = [0, 0], zoom = 1, bearing = 0) {
        return new maplibregl.Map({
            container: container, // HTML element ID or element to render the map
            style: "https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json", // Map style URL
            center: center, // Initial map center [longitude, latitude]
            zoom: zoom, // Initial zoom level
            bearing: bearing, // Initial bearing (rotation)
            antialias: true, // Enable antialiasing
            hash: "map", // Enable URL hash for map state
            glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf", // Font glyphs URL
        });
    },

    // Add the navigation control to the map (zoom and rotation buttons)
    addNavigationControl(map) {
        map.addControl(new maplibregl.NavigationControl());
    },

    // Add the globe projection control to the map (toggle between 2D and 3D globe)
    addGlobeProjectionControl(map) {
        map.addControl(new maplibregl.GlobeControl(), "top-right");
    },

    // Add a new GeoJSON source to the map
    addSource(map, id, data = { type: "FeatureCollection", features: [] }) {
        map.addSource(id, {
            type: "geojson", // Source type
            data: data, // GeoJSON data
            buffer: 0, // Buffer size in pixels
            maxzoom: 12, // Maximum zoom level
            tolerance: 100, // Simplification tolerance
        });
    },

    // Add a new layer to the map
    addLayer(
        map,
        id, // Layer ID
        source, // Source ID
        type = "circle", // Layer type (e.g., circle, symbol, fill)
        layoutOptions = {}, // Layout properties for the layer
        paintOptions = {}, // Paint properties for the layer
        filterOptions = ['all'], // Filter expression for the layer
        minzoom = 0, // Minimum zoom level
        maxzoom = 24, // Maximum zoom level
    ) {
        const layerConfig = {
            id: id,
            source: source,
            type: type,
            layout: layoutOptions,
            paint: paintOptions,
            filter: filterOptions,
            minzoom: minzoom,
            maxzoom: maxzoom,
        };

        map.addLayer(layerConfig); // Add the layer to the map
    },

    // Update the data of a GeoJSON source
    updateSource(map, id, features) {
        const source = map.getSource(id); // Get the source by ID
        if (source) {
            source.setData({
                type: "FeatureCollection",
                features: features, // Update the features
            });
        }
    },

    // Add an icon to the map
    async addIcon(map, id, imageUrl) {
        try {
            const icon = await this.loadImage(imageUrl); // Load the image

            // Check if the icon already exists and remove it if necessary
            if (map.hasImage(id)) {
                map.removeImage(id);
            }

            // Add the icon to the map
            if (icon) {
                map.addImage(id, icon, { sdf: true }); // SDF (Signed Distance Field) for dynamic styling
            }
        } catch (error) {
            console.error("Error loading image:", error);
        }
    },

    // Load an image asynchronously
    loadImage(imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image(); // Create a new image element
            img.src = imageUrl; // Set the image source
            img.onload = () => {
                resolve(img); // Resolve the promise when the image loads
            };
            img.onerror = (error) => {
                reject(error); // Reject the promise if there's an error
            };
        });
    },

    // Add a draw control to the map for drawing shapes
    addDrawControl(map, options) {
        const draw = new MapboxDraw(options); // Create a new Mapbox Draw control
        map.addControl(draw); // Add the control to the map
        return draw; // Return the draw control instance
    },

    // Add a method to center the map on given coordinates
    centerMapOnCoordinates(map, coordinates) {
        map.setCenter(coordinates);
        map.setZoom(12);
    },
};
