<template>
  <v-app>
    <v-app-bar color="white" density="compact" elevation="0">
      <v-app-bar-title><span class="title">GEOGLIFY</span></v-app-bar-title>

      <template v-slot:append>
        <v-list-item v-if="weather" class="pa-0 weather_info">
          <v-list-item-title class="text-body-1">{{ weather.name }}</v-list-item-title>

          <v-list-item-subtitle class="text-caption">
            {{
              weather.main.temp.toFixed(0) +
              "°C, " +
              weather.weather[0].description.toUpperCase()
            }}
          </v-list-item-subtitle>

          <template v-slot:prepend class="weather_icon">
            <v-avatar :tile="true" class="mr-2">
              <img
                width="40"
                :src="
                  'https://openweathermap.org/img/wn/' +
                  weather.weather[0].icon +
                  '@2x.png'
                "
                alt="logo"
              />
            </v-avatar>
          </template>
        </v-list-item>
      </template>
    </v-app-bar>

    <v-system-bar color="blue-grey-darken-3" dark v-if="weather">
      <span class="ms-2">{{ currentTime }}</span>
      <v-spacer></v-spacer>
      <v-icon icon="mdi-thermometer-minus" size="x-small" class="ml-3" />
      <span class="ms-1">{{ weather.main.temp_min.toFixed(0) }} °C</span>
      <v-icon icon="mdi-thermometer-plus" size="x-small" class="ml-3" />
      <span class="ms-1"> {{ weather.main.temp_max.toFixed(0) }} °C</span>
      <v-icon icon="mdi-windsock" size="x-small" class="ml-3" />
      <span class="ms-1">{{ (weather.wind.speed * 3.6).toFixed(0) }} km/h</span>
      <v-icon icon="mdi-water-percent" size="x-small" class="ml-3" />
      <span class="ms-1">{{ weather.main.humidity }} %</span>
    </v-system-bar>

    <v-navigation-drawer expand-on-hover rail color="white">
      <v-list density="compact" nav>
        <v-list-item title="Ships" value="ships" @click="toggleNavigation('ships')">
          <template v-slot:prepend>
            <v-icon icon="mdi-ferry" size="small"></v-icon>
          </template>
        </v-list-item>
        <v-list-item title="Layers" value="layers" @click="toggleNavigation('layers')">
          <template v-slot:prepend>
            <v-icon icon="mdi-layers" size="small"></v-icon>
          </template>
        </v-list-item>
      </v-list>

      <template v-slot:append>
        <div class="pa-5"></div>
      </template>
    </v-navigation-drawer>

    <v-navigation-drawer v-model="combinedNavigationState" location="right" :width="400" class="sidebar">
      <v-toolbar dark class="fixed-bar" v-if="isNavigationShipsDrawerOpen">
        <v-toolbar-title class="font-weight-black">
          <v-icon icon="mdi-ferry" size="small" class="mr-2"></v-icon>Ships
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="isNavigationShipsDrawerOpen = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-toolbar dark class="fixed-bar" v-if="isNavigationLayersDrawerOpen">
        <v-toolbar-title class="font-weight-black">
          <v-icon icon="mdi-layers" size="small" class="mr-2"></v-icon>Layers
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="isNavigationLayersDrawerOpen = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-divider></v-divider>

      <Layers v-if="isNavigationLayersDrawerOpen"></Layers>
      <Ships v-if="isNavigationShipsDrawerOpen"></Ships>
    </v-navigation-drawer>

    <v-main class="main-content">
      <slot />
    </v-main>

    <div class="content"><Ship></Ship></div>
  </v-app>
</template>

<script>
export default {
  data() {
    return {
      currentTime: "",
      weather: null,
      isNavigationLayersDrawerOpen: false,
      isNavigationShipsDrawerOpen: false,
    };
  },
  computed: {
    combinedNavigationState() {
      return this.isNavigationLayersDrawerOpen || this.isNavigationShipsDrawerOpen;
    },
  },
  async created() {
    await this.updateTime();
    setInterval(() => this.updateTime(), 1000);
    await this.fetchWeatherData();
  },
  methods: {
    async updateTime() {
      const date = new Date();
      this.currentTime = date.toLocaleString("en-GB");
    },
    async getCurrentPosition() {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
    },
    async fetchWeatherData() {
      try {
        const API_KEY = this.$config.public.OPENWEATHERMAP_API_KEY;
        const position = await this.getCurrentPosition();
        const { latitude: lat, longitude: lon } = position.coords;
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}&units=metric`
        );
        this.weather = await response.json();
        console.log(this.weather);
      } catch (error) {
        console.error('Error fetching weather data:', error);
      }
    },
    toggleNavigation(drawer) {
      if (drawer === "ships") {
        this.isNavigationShipsDrawerOpen = !this.isNavigationShipsDrawerOpen;
        this.isNavigationLayersDrawerOpen = false;
      } else if (drawer === "layers") {
        this.isNavigationLayersDrawerOpen = !this.isNavigationLayersDrawerOpen;
        this.isNavigationShipsDrawerOpen = false;
      }

      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 1000);
      
    },
  },
};
</script>

<style>
.main-content {
  height: 100vh;
}
.weather_info .v-list-item__prepend {
  display: block;
}
.fixed-bar {
  position: sticky;
  position: -webkit-sticky;
  top: 0;
  z-index: 2;
}
.sidebar .v-navigation-drawer__content
{
  overflow: hidden;
}
</style>
