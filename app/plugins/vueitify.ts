// import this after install `@mdi/font` package
import "@mdi/font/css/materialdesignicons.css";

import "vuetify/styles";
import { createVuetify } from "vuetify";

import "@/assets/main.scss";

const geoglify = {
  dark: true,
  colors: {
    background: "#0D47A1",
    surface: "#0D47A1",
    primary: "#6200EE",
  },
};

export default defineNuxtPlugin((app) => {
  const vuetify = createVuetify({
    display: {
      mobileBreakpoint: "md",
      thresholds: {
        xs: 0,
        sm: 340,
        md: 540,
        lg: 800,
        xl: 1280,
      },
    },
    theme: {
      themes: {
        geoglify,
      },
    },
  });
  app.vueApp.use(vuetify);
});
