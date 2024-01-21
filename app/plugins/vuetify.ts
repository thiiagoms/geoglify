// import this after install `@mdi/font` package
import '@mdi/font/css/materialdesignicons.css'

import 'vuetify/styles'
import { createVuetify } from 'vuetify'

import '@/assets/main.scss';

const geoglify = {
  dark: true,
  colors: {
    background: '#0D47A1',
    surface: '#0D47A1',
    primary: '#6200EE',
  },
}

export default defineNuxtPlugin((app) => {
  const vuetify = createVuetify({
    theme: {
      themes: {
        geoglify,
      },
    },
  })
  app.vueApp.use(vuetify)
})
