import MapHelper from "@/Helpers/MapHelper";

/**
 * Helper functions for the searoutes
 */
export default {
    /**
     * Add a searoutes layer to the map
     * @param {*} map
     * @param {*} id
     * @param {*} source
     */
    addLayer(map, id, source) {
        const layoutOptions = {
            "line-cap": "round",
            "line-join": "round",
        };

        const paintOptions = {
            "line-color": "#D13E56",
            "line-width": 2,
            "line-opacity": 0.8,
        };

        MapHelper.addLayer(
            map,
            id,
            source,
            "line",
            layoutOptions,
            paintOptions
        );
    },
};
