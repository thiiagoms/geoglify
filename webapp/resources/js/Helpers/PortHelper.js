import MapHelper from "@/Helpers/MapHelper";

/**
 * Helper functions for the ports
 */
export default {
    /**
     * Add a port layer to the map
     * @param {*} map
     * @param {*} id
     * @param {*} source
     */
    addLayer(map, id, source) {
        const layoutOptions = {};

        const paintOptions = {
            "circle-radius": 4,
            "circle-color": "black",
            "circle-stroke-color": "white",
            "circle-stroke-width": 1,
            "circle-opacity": 0.8,
            "circle-stroke-opacity": 0.2,
        };

        MapHelper.addLayer(
            map,
            id,
            source,
            "circle",
            layoutOptions,
            paintOptions
        );
    },
};
