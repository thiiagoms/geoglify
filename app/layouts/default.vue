<template>
  <v-app>
    <v-app-bar color="white" density="compact" elevation="0">
      <template v-slot:prepend>
        <v-avatar size="24"
          ><v-img src="@/assets/logo.png" alt="logo"></v-img
        ></v-avatar>
      </template>

      <v-app-bar-title class="font-weight-black">GEOGLIFY</v-app-bar-title>

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
      v-model="combinedNavigationLeftState"
      location="left"
      :width="400"
      class="sidebar"
      @transitionend="dispatchResize"
      permanent
    >
      <Layers v-if="isNavigationLayersDrawerOpen"></Layers>
      <WmsLayers v-if="isNavigationWmsLayersDrawerOpen"></WmsLayers>
      <Ships v-if="isNavigationShipsDrawerOpen"></Ships>
      <Cargos v-if="isNavigationCargosDrawerOpen"></Cargos>
    </v-navigation-drawer>

    <v-navigation-drawer
      v-model="combinedNavigationRightState"
      location="right"
      :width="400"
      class="sidebar"
      @transitionend="dispatchResize"
      permanent
    >
      <Ship v-if="isSelectedShipDrawerOpen"></Ship>
      <Feature v-if="isSelectedFeatureDrawerOpen"></Feature>
    </v-navigation-drawer>

    <v-main class="main-content">
      <v-layout-item
        model-value
        class="float-left pointer-events-none"
        height="0"
      >
        <v-btn
          icon="mdi-ferry"
          color="white"
          dark
          elevation="0"
          rounded="lg"
          :active="isNavigationShipsDrawerOpen"
          @click="toggleNavigation('ships')"
          class="float-left pointer-events-initial"
          style="position: absolute; top: 10px; left: 10px"
        />

        <v-btn
          icon="mdi-layers"
          color="white"
          dark
          elevation="0"
          rounded="lg"
          :active="isNavigationLayersDrawerOpen"
          @click="toggleNavigation('layers')"
          class="float-left pointer-events-initial"
          style="position: absolute; top: 70px; left: 10px"
        />

        <v-btn
          icon="mdi-label-multiple"
          color="white"
          dark
          elevation="0"
          rounded="lg"
          :active="isNavigationCargosDrawerOpen"
          @click="toggleNavigation('cargos')"
          class="float-left pointer-events-initial"
          style="position: absolute; top: 130px; left: 10px"
        />

        <v-btn
          icon="mdi-earth-box"
          color="white"
          dark
          elevation="0"
          rounded="lg"
          :active="isNavigationWmsLayersDrawerOpen"
          @click="toggleNavigation('wmsLayers')"
          class="float-left pointer-events-initial"
          style="position: absolute; top: 190px; left: 10px"
        />
    
      </v-layout-item>
      <slot />
    </v-main>
  </v-app>
</template>

<script>
export default {
  setup() {
    const layersStoreInstance = layersStore();
    const wmsLayersStoreInstance = wmsLayersStore();
    const shipsStoreInstance = shipsStore();
    const cargosStoreInstance = cargosStore();
    return { layersStoreInstance, shipsStoreInstance, cargosStoreInstance, wmsLayersStoreInstance };
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
    isNavigationCargosDrawerOpen() {
      return this.cargosStoreInstance.isNavigationDrawerOpen;
    },
    isNavigationWmsLayersDrawerOpen() {
      return this.wmsLayersStoreInstance.isNavigationDrawerOpen;
    },
    isSelectedShipDrawerOpen() {
      return !!this.shipsStoreInstance.selectedShip;
    },
    isSelectedFeatureDrawerOpen() {
      return !!this.layersStoreInstance.selectedFeature;
    },
    combinedNavigationRightState() {
      return this.isSelectedFeatureDrawerOpen || this.isSelectedShipDrawerOpen
    },
    combinedNavigationLeftState() {
      return (
        this.layersStoreInstance.isNavigationDrawerOpen ||
        this.shipsStoreInstance.isNavigationDrawerOpen || 
        this.cargosStoreInstance.isNavigationDrawerOpen ||
        this.wmsLayersStoreInstance.isNavigationDrawerOpen
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
        this.cargosStoreInstance.setNavigationDrawerState(false);
        this.wmsLayersStoreInstance.setNavigationDrawerState(false);
        this.shipsStoreInstance.toggleNavigationDrawerState();        
      } else if (drawer === "layers") {
        this.shipsStoreInstance.setNavigationDrawerState(false);
        this.cargosStoreInstance.setNavigationDrawerState(false);
        this.wmsLayersStoreInstance.setNavigationDrawerState(false);
        this.layersStoreInstance.toggleNavigationDrawerState();
      } else if (drawer === "cargos") {
        this.shipsStoreInstance.setNavigationDrawerState(false);
        this.layersStoreInstance.setNavigationDrawerState(false);
        this.wmsLayersStoreInstance.setNavigationDrawerState(false);
        this.cargosStoreInstance.toggleNavigationDrawerState();
      } else if (drawer === "wmsLayers") {
        this.shipsStoreInstance.setNavigationDrawerState(false);
        this.layersStoreInstance.setNavigationDrawerState(false);
        this.cargosStoreInstance.setNavigationDrawerState(false);
        this.wmsLayersStoreInstance.toggleNavigationDrawerState();
      }
    },
  }
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
