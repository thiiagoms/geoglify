import maplibregl from "maplibre-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";

MapboxDraw.constants.classes.CONTROL_BASE = "maplibregl-ctrl";
MapboxDraw.constants.classes.CONTROL_PREFIX = "maplibregl-ctrl-";
MapboxDraw.constants.classes.CONTROL_GROUP = "maplibregl-ctrl-group";

const initialStyle = {
    version: 8,
    projection: {
        type: "globe",
    },
    glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
    sources: {
        satellite: {
            url: "https://api.maptiler.com/maps/satellite/tiles.json?key=Qbwxcd8lf8BWDwAZyp5B",
            type: "raster",
        },
    },
    layers: [
        {
            id: "Satellite",
            type: "raster",
            source: "satellite",
        },
    ],
    sky: {
        "atmosphere-blend": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            1,
            5,
            1,
            7,
            0,
        ],
    },
    light: {
        anchor: "map",
        position: [1.5, 90, 80],
    },
};

/**
 * Map helper functions
 */
export default {
    /**
     * Create a map
     * @param {*} container
     * @param {*} center
     * @param {*} zoom
     * @returns
     */
    createMap(container, center = [0, 0], zoom = 1) {
        let map = new maplibregl.Map({
            container: container,
            style: initialStyle,
            center: center,
            zoom: zoom,
            antialias: true,
            hash: "map",
        });

        map.addControl(new maplibregl.GlobeControl(), "top-right");

        return map;
    },

    /**
     * Add the navigation control to the map
     * @param {*} map
     */
    addNavigationControl(map) {
        map.addControl(new maplibregl.NavigationControl());
    },

    /**
     * Add new source to the map
     * @param {*} map
     * @param {*} id
     * @param {*} data
     */
    addSource(map, id, data = { type: "FeatureCollection", features: [] }) {
        map.addSource(id, {
            type: "geojson",
            data: data,
        });
    },

    /**
     * Add new layer to the map
     * @param {*} map
     * @param {*} id
     * @param {*} source
     * @param {*} type
     * @param {*} layoutOptions
     * @param {*} paintOptions
     */
    addLayer(
        map,
        id,
        source,
        type = "circle",
        layoutOptions = {},
        paintOptions = {}
    ) {
        const layerConfig = {
            id: id,
            source: source,
            type: type,
        };

        layerConfig.layout = layoutOptions;
        layerConfig.paint = paintOptions;

        map.addLayer(layerConfig);
    },

    /**
     * Update the source data in the map
     * @param {*} map
     * @param {*} id
     * @param {*} features
     */
    updateSource(map, id, features) {
        const source = map.getSource(id);
        if (source) {
            source.setData({
                type: "FeatureCollection",
                features: features,
            });
        }
    },

    /**
     * Add a icon to the map
     * @param {*} map
     * @param {*} id
     * @param {*} imageUrl
     */
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

    /**
     * Load an image from a URL
     * @param {*} imageUrl
     * @returns
     */
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

    /**
     * Add a draw control to the map
     * @param {*} map
     * @param {*} options
     */
    addDrawControl(map, options) {
        const draw = new MapboxDraw(options);
        map.addControl(draw);
        return draw;
    },
};
