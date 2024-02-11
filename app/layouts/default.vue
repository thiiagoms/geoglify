<template>
  <v-app>
    <v-app-bar color="white" density="compact" elevation="0">
      <v-app-bar-title><span class="title">GEOGLIFY</span></v-app-bar-title>

      <template v-slot:append>
        <v-list-item v-if="weather" class="pa-0 weather_info">
          <v-list-item-title class="text-body-1">{{
            weather.name
          }}</v-list-item-title>

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

    <v-progress-linear
      indeterminate
      color="yellow-darken-2"
      v-if="shipsStoreInstance.isLoading"
    ></v-progress-linear>

    <v-system-bar color="blue-grey-darken-3" dark>
      <span class="ms-2">{{ currentTime }}</span>

      <v-spacer></v-spacer>

      <div v-if="weather">
        <v-icon icon="mdi-thermometer-minus" size="x-small" class="ml-3" />
        <span class="ms-1">{{ weather.main.temp_min.toFixed(0) }} °C</span>
        <v-icon icon="mdi-thermometer-plus" size="x-small" class="ml-3" />
        <span class="ms-1"> {{ weather.main.temp_max.toFixed(0) }} °C</span>
        <v-icon icon="mdi-windsock" size="x-small" class="ml-3" />
        <span class="ms-1"
          >{{ (weather.wind.speed * 3.6).toFixed(0) }} km/h</span
        >
        <v-icon icon="mdi-water-percent" size="x-small" class="ml-3" />
        <span class="ms-1">{{ weather.main.humidity }} %</span>
      </div>
    </v-system-bar>

    <v-navigation-drawer
      v-model="combinedNavigationState"
      location="left"
      :width="400"
      class="sidebar"
      @transitionend="dispatchResize"
      permanent
    >
      <Layers v-if="isNavigationLayersDrawerOpen"></Layers>
      <Ships v-if="isNavigationShipsDrawerOpen"></Ships>
    </v-navigation-drawer>

    <v-navigation-drawer
      v-model="isSelectedShipDrawerOpen"
      location="right"
      :width="400"
      class="sidebar"
      @transitionend="dispatchResize"
      permanent
    >
      <Ship></Ship>
    </v-navigation-drawer>

    <v-main class="main-content">
      <v-layout-item model-value class="float-left pointer-events-none">
        <div class="ma-4 pointer-events-initial">
          <v-btn
            icon="mdi-ferry"
            color="white"
            dark
            elevation="0"
            rounded="lg"
            :active="isNavigationShipsDrawerOpen"
            @click="toggleNavigation('ships')"
          />
        </div>
        <div class="ma-4 pointer-events-initial">
          <v-btn
            icon="mdi-layers"
            color="white"
            dark
            elevation="0"
            rounded="lg"
            :active="isNavigationLayersDrawerOpen"
            @click="toggleNavigation('layers')"
          />
        </div>
      </v-layout-item>
      <slot />
    </v-main>
  </v-app>
</template>

<script>
export default {
  setup() {
    const layersStoreInstance = layersStore();
    const shipsStoreInstance = shipsStore();
    return { layersStoreInstance, shipsStoreInstance };
  },

  data() {
    return {
      currentTime: "",
      weather: null,
    };
  },
  computed: {
    isNavigationLayersDrawerOpen() {
      return this.layersStoreInstance.isNavigationDrawerOpen;
    },
    isNavigationShipsDrawerOpen() {
      return this.shipsStoreInstance.isNavigationDrawerOpen;
    },
    isSelectedShipDrawerOpen() {
      return this.shipsStoreInstance.selectedShip;
    },
    combinedNavigationState() {
      return (
        this.layersStoreInstance.isNavigationDrawerOpen ||
        this.shipsStoreInstance.isNavigationDrawerOpen
      );
    },
  },
  async created() {
    await this.updateTime();
    setInterval(() => this.updateTime(), 1000);
    await this.fetchWeatherData();
  },
  methods: {
    dispatchResize() {
      window.dispatchEvent(new Event("resize"));
    },
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
      } catch (error) {
        console.error("Error fetching weather data:", error);
      }
    },
    toggleNavigation(drawer) {
      if (drawer === "ships") {
        this.layersStoreInstance.setNavigationDrawerState(false);
        this.shipsStoreInstance.toggleNavigationDrawerState();
      } else if (drawer === "layers") {
        this.shipsStoreInstance.setNavigationDrawerState(false);
        this.layersStoreInstance.toggleNavigationDrawerState();
      }
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
.sidebar .v-navigation-drawer__content {
  overflow: hidden;
}
.pointer-events-none {
  pointer-events: none;
}

.pointer-events-initial {
  pointer-events: initial;
}
</style>
