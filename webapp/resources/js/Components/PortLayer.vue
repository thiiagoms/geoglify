<script>
export default {
    props: ["mapInstance"],

    watch: {
        mapInstance(newVal) {
            if (newVal) {
                this.initializeLayer();
            }
        },
    },

    mounted() {
        if (this.mapInstance) {
            this.initializeLayer();
        }
    },

    methods: {
        initializeLayer() {
            // Remove source and layer if already exists
            if (this.mapInstance.getSource("ports")) {
                this.mapInstance.removeLayer("ports");
                this.mapInstance.removeSource("ports");
            }

            // Add source for ports
            this.mapInstance.addSource("ports", {
                type: "vector",
                url: `http://localhost:3000/ports`,
            });

            // Add MVT Tile Layer for ports with circle styling
            this.mapInstance.addLayer({
                id: "ports",
                type: "circle",
                source: "ports",
                "source-layer": "ports",
                paint: {
                    "circle-radius": 5,
                    "circle-color": "BLACK",
                    "circle-stroke-color": "white",
                    "circle-stroke-width": 1,
                    "circle-opacity": 0.8,
                    "circle-stroke-opacity": 0.2,
                },
                layout: {
                    visibility: "none",
                },
            });
        },

        // Toggle visibility of the layer
        toggleVisibility() {
            if (this.mapInstance) {
                let visibility = this.mapInstance.getLayoutProperty(
                    "ports",
                    "visibility"
                );

                visibility = visibility == "visible" ? "none" : "visible";

                this.mapInstance.setLayoutProperty(
                    "ports",
                    "visibility",
                    visibility
                );
            }
        },
    },
};
</script>

<template>
    <div></div>
</template>
