<template>
  <div style="height: 100%; width: 100%">
    <div :style="{ height: !!layerIdToView ? '60%' : '100%', width: '100%' }" ref="mapContainer">
      <Map></Map>
    </div>
    <div style="height: 40%; width: 100%" v-if="layerIdToView">
      <Features :layerId="layerIdToView"></Features>
    </div>
  </div>
</template>

<script>
  const appName = "Geoglify";
  const appDescription = "You're in the right place";

  useHead({
    htmlAttrs: { lang: "en" },
    link: [
      { rel: "canonical", href: "https://geoglify.com/" },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon-32x32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/favicon-16x16.png",
      },
    ],
    title: appName,
    meta: [
      {
        name: "description",
        content: appDescription,
      },
      { property: "og:title", content: appName },
      {
        property: "og:description",
        content: appDescription,
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://geoglify.com" },
      { property: "og:locale", content: "en_US" },
      { property: "og:image", content: "https://geoglify.com/social.png" },
    ],
  });

  export default {
    setup() {
      const layersStoreInstance = layersStore();
      return { layersStoreInstance };
    },

    computed: {
      layerIdToView() {
        return this.layersStoreInstance.layerIdToView;
      },
    },

    mounted() {
      // Listen for changes in the map div height and dispatch window resize event
      const mapContainer = this.$refs.mapContainer;
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          if (entry.target === mapContainer) {
            window.dispatchEvent(new Event("resize"));
            break;
          }
        }
      });
      observer.observe(mapContainer);
    },
  };
</script>
