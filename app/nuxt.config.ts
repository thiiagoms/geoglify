// https://nuxt.com/docs/api/configuration/nuxt-config
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
export default defineNuxtConfig({
  devtools: { enabled: true },
  build: {
    transpile: ['vuetify'],
  },
  runtimeConfig: {
    public: {
      REALTIME_URL: process.env.REALTIME_URL,
      API_URL: process.env.API_URL,
      MAPBOX_TOKEN: process.env.MAPBOX_TOKEN,
      OPENWEATHERMAP_API_KEY: process.env.OPENWEATHERMAP_API_KEY
    },
  },
  modules: [
    "@nuxtjs/google-fonts",
    ['@pinia/nuxt', { disableVuex: false }],
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        // @ts-expect-error
        config.plugins.push(vuetify({ autoImport: true }))
      })
    },
  ],
  ssr: false,
  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },
  css: ["vue-circle-flags/dist/vue-circle-flags.css"],
  googleFonts: {
    families: {
      'Figtree': true,
      "Signika": true
    }
  },
  pinia: {
    storesDirs: ['./stores/**'],
  },
})
