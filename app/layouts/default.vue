<template>
  <v-app>
    <!-- NavBar -->
    <v-app-bar color="white" class="d-flex w-100 align-center py-0 px-2">
      <v-app-bar-title class="font-weight-bold">
        <v-list>
          <v-list-item prepend-avatar="@/assets/logo.png" class="pa-0 ma-0">
            <v-list-item-title class="text-h5 font-weight-bold">Geoglify</v-list-item-title>
            <v-list-item-subtitle class="text-caption font-weight-bold">You're in the right sea</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-app-bar-title>

      <template v-slot:append>
        <v-list-item v-if="weather" class="pa-0 ma-0" :prepend-avatar="'https://openweathermap.org/img/wn/' + weather.weather[0].icon + '@2x.png'">
          <v-list-item-title class="text-body-2">{{ weather.name }}</v-list-item-title>
          <v-list-item-subtitle class="text-body-2">{{ weather.main.temp.toFixed(0) + "°, " + weather.weather[0].description }}</v-list-item-subtitle>
        </v-list-item>
      </template>
    </v-app-bar>

    <!-- Bar -->
    <v-system-bar color="black" dark class="d-flex w-100 align-center px-3 text-body-2">
      <span v-if="!isMobile">{{ currentTime }}</span>

      <v-spacer v-if="!isMobile"></v-spacer>

      <div v-if="weather">
        <v-icon icon="mdi-thermometer-minus" size="small" class="ml-3" color="white"/>
        <span class="ms-1">{{ weather.main.temp_min.toFixed(0) }} °C</span>
        <v-icon icon="mdi-thermometer-plus" size="small" class="ml-3" />
        <span class="ms-1"> {{ weather.main.temp_max.toFixed(0) }} °C</span>
        <v-icon icon="mdi-windsock" size="small" class="ml-3" />
        <span class="ms-1">{{ (weather.wind.speed * 3.6).toFixed(0) }} km/h</span>
        <v-icon icon="mdi-water-percent" size="small" class="ml-3" />
        <span class="ms-1">{{ weather.main.humidity }} %</span>
      </div>
    </v-system-bar>

    <!-- Main -->
    <v-main>
      <slot />
    </v-main>

    <!-- Footer -->
    <v-footer class="d-flex w-100 align-center text-caption px-3" color="black" density="compact" app dark>
      <v-row justify="center" no-gutters>
        <AuthenticationStatus />
        <v-spacer></v-spacer>
        <iframe src="https://ghbtns.com/github-btn.html?user=geoglify&repo=geoglify&type=star&count=true&size=large" frameborder="0" scrolling="0" width="130" height="32" title="GitHub"></iframe>
      </v-row>
    </v-footer>
  </v-app>
</template>

<script>
  export default {
    data() {
      return {
        currentTime: "",
        weather: null,
        isMobile: false,
      };
    },

    mounted() {
      this.updateTime();
      this.fetchWeatherData();
      setInterval(this.updateTime, 1000);
      this.checkIfMobile(); // Verifica se o dispositivo é móvel após a montagem do componente
      window.addEventListener("resize", this.checkIfMobile); // Verifica se o dispositivo é móvel ao redimensionar a janela
    },

    methods: {
      async updateTime() {
        const date = new Date();
        this.currentTime = date.toLocaleString();
      },
      async getCurrentPosition() {
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
      },
      async fetchWeatherData() {
        try {
          const API_KEY = this.$config.public.OPENWEATHERMAP_API_KEY || "790a9878f3ac207114becfad4a7870aa";
          const position = await this.getCurrentPosition();
          const { latitude: lat, longitude: lon } = position.coords;
          const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}&units=metric`);
          this.weather = await response.json();
        } catch (error) {
          setInterval(this.fetchWeatherData, 15000);
          console.error("Error fetching weather data:", error);
        }
      },
      checkIfMobile() {
        this.isMobile = window.innerWidth <= 600; // Define isMobile como verdadeiro se a largura da janela for menor ou igual a 600 pixels
      },
    },
  };
</script>

<style>
  .v-toolbar__content > .v-toolbar-title {
    margin-inline-start: 0px !important;
  }
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active {
    -webkit-background-clip: text;
    -webkit-text-fill-color: black;
  }
</style>
