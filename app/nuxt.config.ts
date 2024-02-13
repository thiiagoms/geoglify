// https://nuxt.com/docs/api/configuration/nuxt-config
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

const appName = 'Geoglify'
const appDescription = "You're in the right place"

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
    '@vite-pwa/nuxt',
    '@nuxtjs/google-fonts',
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
  pwa: {
    scope: '/',
    base: '/',
    injectRegister: 'auto',
    registerType: 'autoUpdate',
    manifest: {
      name: appName,
      short_name: appName,
      description: appDescription,
      theme_color: "#1867c0",
      background_color: "#1867c0",
      icons: [
        {
          src: 'pwa-64x64.png',
          sizes: '64x64',
          type: 'image/png'
        },
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: 'maskable-icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    },
    registerWebManifestInRouteRules: true,
    workbox: {
      navigateFallback: undefined,
      cleanupOutdatedCaches: true,
      globPatterns: ['**/*.{json,ico,svg,ttf,woff,css,scss,js,html,txt,jpg,png,woff2,mjs,otf,ani}'],
      runtimeCaching: [
        {
          urlPattern: "/",
          handler: 'NetworkFirst',
        },
        {
          urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "mapbox-cache",
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],
    },
    client: {
      installPrompt: false,
      periodicSyncForUpdates: 20, //seconds
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      navigateFallback: 'index.html',
      type: 'module',
    },
  },
})
