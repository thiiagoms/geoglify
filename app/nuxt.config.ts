// https://nuxt.com/docs/api/configuration/nuxt-config
import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";

export default defineNuxtConfig({
  devtools: { enabled: true },
  build: {
    transpile: ["vuetify"],
  },
  experimental: {
    watcher: "chokidar",
  },
  nitro: {
    devProxy: {
      "/_api": {
        target: "http://localhost:8081",
        changeOrigin: true,
        prependPath: true,
      },
    },
  },
  runtimeConfig: {
    API_URL: process.env.API_URL || "http://localhost:8081",
    public: {
      REALTIME_URL: process.env.REALTIME_URL || "http://localhost:8080",
      MAPBOX_TOKEN: process.env.MAPBOX_TOKEN,
      OPENWEATHERMAP_API_KEY: process.env.OPENWEATHERMAP_API_KEY,
    },
  },
  modules: [
    "nuxt-gtag",
    'nuxt-svgo',
    "@nuxtjs/google-fonts",
    ["@pinia/nuxt", { disableVuex: false }],
    (_options, nuxt) => {
      nuxt.hooks.hook("vite:extendConfig", (config) => {
        // @ts-expect-error
        config.plugins.push(vuetify({ autoImport: true }));
      });
    },
  ],
  gtag: {
    id: "G-DX7RJHR1G4",
  },
  svgo: {
    autoImportPath: '../../../node_modules/circle-flags/flags/',
  },
  ssr: false,
  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    }
  },
  googleFonts: {
    families: {
      Nunito: {
        // weights
        wght: "200..1000",
        ital: "200..1000",
      },
    },
  },
  pinia: {
    storesDirs: ["./stores/**"],
  },
});
