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
      "/api": {
        target: "http://localhost:8081",
        changeOrigin: true,
        prependPath: true,
      },
      "/realtime": {
        target: "http://localhost:8080",
        changeOrigin: true,
        ws: true,
      },
      "/socket.io": {
        target: "http://localhost:8080",
        changeOrigin: true,
        ws: true,
      },
    },
  },
  runtimeConfig: {
    public: {
      REALTIME_URL: process.env.REALTIME_URL,
      API_URL: process.env.API_URL,
      MAPBOX_TOKEN: process.env.MAPBOX_TOKEN,
      OPENWEATHERMAP_API_KEY: process.env.OPENWEATHERMAP_API_KEY,
    },
  },
  modules: [
    "nuxt-gtag",
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
  ssr: false,
  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
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
