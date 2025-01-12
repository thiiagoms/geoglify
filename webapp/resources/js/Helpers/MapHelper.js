import maplibregl from "maplibre-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { bearing } from "@turf/turf";

MapboxDraw.constants.classes.CONTROL_BASE = "maplibregl-ctrl";
MapboxDraw.constants.classes.CONTROL_PREFIX = "maplibregl-ctrl-";
MapboxDraw.constants.classes.CONTROL_GROUP = "maplibregl-ctrl-group";

/**
 * Map helper functions
 */
export default {
    // Create a new map
    createMap(container, center = [0, 0], zoom = 1, bearing = 0) {
        return new maplibregl.Map({
            container: container,
            style: "https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json",
            center: center,
            zoom: zoom,
            bearing: bearing,
            antialias: true,
            hash: "map",
            glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
        });
    },

    // Add the navigation control to the map
    addNavigationControl(map) {
        map.addControl(new maplibregl.NavigationControl());
    },

    // Add the scale control to the map
    addGlobeProjectionControl(map) {
        map.addControl(new maplibregl.GlobeControl(), "top-right");
    },

    // Add a new source to the map
    addSource(map, id, data = { type: "FeatureCollection", features: [] }) {
        map.addSource(id, {
            type: "geojson",
            data: data,
        });
    },

    // Add a new layer to the map
    addLayer(
        map,
        id,
        source,
        type = "circle",
        layoutOptions = {},
        paintOptions = {},
        filterOptions = ['all']
    ) {
        const layerConfig = {
            id: id,
            source: source,
            type: type,
            layout: layoutOptions,
            paint: paintOptions,
            filter: filterOptions,
        };

        map.addLayer(layerConfig);
    },

    // Update the source data
    updateSource(map, id, features) {
        const source = map.getSource(id);
        if (source) {
            source.setData({
                type: "FeatureCollection",
                features: features,
            });
        }
    },

    // Add an icon to the map
    async addIcon(map, id, imageUrl) {
        try {
            const icon = await this.loadImage(imageUrl);

            // Check if id already exists
            if (map.hasImage(id)) {
                map.removeImage(id);
            }

            if (icon) {
                map.addImage(id, icon, { sdf: true });
            }
        } catch (error) {
            console.error("Error loading image:", error);
        }
    },

    // Load an image
    loadImage(imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = imageUrl;
            img.onload = () => {
                resolve(img);
            };
            img.onerror = (error) => {
                reject(error);
            };
        });
    },

    // Add a draw control to the map
    addDrawControl(map, options) {
        const draw = new MapboxDraw(options);
        map.addControl(draw);
        return draw;
    },
};
