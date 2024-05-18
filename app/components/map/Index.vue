<template>
  <div id="map" class="map"></div>
  
  <Layers v-if="!!ready" :map="map" :tooltip="tooltip"></Layers>
  <LayersList v-if="!!ready" :map="map"></LayersList>

  <Ships v-if="!!ready" :map="map" :tooltip="tooltip"></Ships>
  <ShipsList v-if="!!ready" :map="map"></ShipsList>
  <ShipsDetails v-if="!!ready"></ShipsDetails>


  <Feature></Feature>
</template>
<script>
  const { status } = useAuth();

  // Import the necessary libraries
  import maplibregl from "maplibre-gl";
  import BasemapsControl from "maplibre-gl-basemaps";

  import configs from "~/helpers/configs";
  import Toolbox from "~/helpers/toolbox";

  // Default map parameters
  const DEFAULT_MAP_CENTER = [0, 0];
  const DEFAULT_MAP_BEARING = 0;
  const DEFAULT_MAP_ZOOM = 1;
  const DEFAULT_MAP_PITCH = 0;

  // Initial view state for the map
  const INITIAL_VIEW_STATE = {
    latitude: DEFAULT_MAP_CENTER[1],
    longitude: DEFAULT_MAP_CENTER[0],
    zoom: DEFAULT_MAP_ZOOM,
    bearing: DEFAULT_MAP_BEARING,
    pitch: DEFAULT_MAP_PITCH,
    transitionDuration: "auto",
  };

  // Export the component
  export default {
    data() {
      return {
        ready: false,
        map: null,
        currentViewState: { ...INITIAL_VIEW_STATE },
        basemaps: configs.getBaseMaps(),
      };
    },

    computed: {
      // Check if the user is authenticated
      isAuthenticated() {
        return status.value === "authenticated";
      },
    },

    // When the component is mounted, create the map
    async mounted() {

      // Create a tooltip
      this.createTooltip();

      // Create a Mapbox GL map
      this.map = new maplibregl.Map({
        container: "map",
        style: {
          version: 8,
          sources: {},
          layers: [],
          glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
        },
        antialias: true,
        center: [this.currentViewState.longitude, this.currentViewState.latitude],
        zoom: this.currentViewState.zoom,
        bearing: this.currentViewState.bearing,
        pitch: this.currentViewState.pitch,
        maxPitch: 0,
        preserveDrawingBuffer: true,
      });

      // Add geolocate control to the map.
      this.map.addControl(
        new maplibregl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true,
          },
          trackUserLocation: true,
        })
      );

      // Add the navigation control to the map
      this.map.addControl(new maplibregl.NavigationControl(), "top-right");

      // Add the basemap control to the map
      this.baseMapControl = new BasemapsControl({
        basemaps: this.basemaps,
        initialBasemap: "google_road",
        expandDirection: "bottom",
      });

      this.map.addControl(this.baseMapControl, "top-right");

      // Wait for the map to load
      while (!this.map.loaded()) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Add the measures control to the map
      this.map.addControl(new Toolbox(), "top-right");

      // if window resize, resize the map
      window.addEventListener("resize", () => {
        this.map.resize();
      });

      // set the ready flag to true
      this.ready = true;
    },

    methods: {
      createTooltip() {
        this.tooltip = document.createElement("div");
        this.tooltip.className = "deck-tooltip";
        this.tooltip.style.position = "absolute";
        this.tooltip.style.zIndex = 1;
        this.tooltip.style.pointerEvents = "none";
        document.body.append(this.tooltip);
      },
    },
  };
</script>
<style>
  .map {
    height: calc(100vh - 64px - 24px - 48px);
    width: 100%;
  }

  .maplibregl-ctrl-basemaps .basemap {
    width: 29px !important;
    height: 29px !important;
    margin: 0px !important;
    margin-left: 4px !important;
    border-radius: 5px !important;
    border: 1px solid white !important;
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
    padding: 3px;
    background: white;
  }

  .maplibregl-ctrl-basemaps .basemap.active {
    border: 1px solid white !important;
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
  }

  .measures_control {
    background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAELSURBVDiNpdO/LkRBFMfxD0rvoJSw0dBsI4QX2Cg8AApRKkh2EaUHUKhQeAYdQRQbOo2ObBQKCdH6k1XcM9xce7e5v2Qy954z39+czJwhUx0dtPTXEE5wjuEUnMIrujH2SuBBTOAx1l0mkw6+sYKbSO72gI9j7XTO5AyaWMJRroq8SYJTPG+yn3ZoRPIOF/H9gVoBTuMBYxjIl7mKObwEvFACd3EYlf3TRhU4abwKXDywIlyrAi/iE9tV4BTbKRps9YEn8YVnXOdyv5WMYgbtHnA6sBZmcR+525hbsIk3WQ+0e8BJ65E7wJq/rnQVP2+Yl7V22VU1sCx7O++yV+wJp+E6UgLm1Yyd6/ADpJd+mQp1ObkAAAAASUVORK5CYII=");
    background-repeat: no-repeat;
    background-position: center;
  }

  .draw_control {
    background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAyAAAAMgBFP3XOwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAD8SURBVDiNpdO/LkRBFMfxz8QmNprdVks8gY5tNAqi1PEAeoXOsmQTkSA2HkOl8AaIf1EoxAtIVDrdUbgre9e9rDXJSSaT8/0m5zczIsIghYQjnKL6df4H+ASR1XlXMgyckwwLd2vhP3C7dIQB4N3SEAeAd3L9BYLWD3DrW3+B4BEHBfB24bh9cA032X6/B94qC7siv6YxmVJaxSvecBgRTSWrX1DHM2Zxh7mIuC+DIUWElFIDbSxHxAuklMYxjxm8Z8LLiHjql9TxgIls9grWcYsNNLCINVyhg7Ge3CzhGFWs4BpNjJY8sk10crfgM/EL7GHql/8xgjPUIsIHHE2U3O0YbCoAAAAASUVORK5CYII=");
    background-repeat: no-repeat;
    background-position: center;
  }

  .length_control {
    background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAbwAAAG8B8aLcQwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAACxSURBVDiNxdOxCQJBEAXQt2IPB4KhbViAoYGJVViKmbGpiXiIbYhgYKKCFZiYrskFet7eqSAOfBaGv3/mz+yKMSoDOWIJeRW3pTq6xbko8Jh7inZCAE4xxhGEEI4pUp1AN4QweKi+/0Rghw7WNQUgOYMZlk2X4WWqxRa2Xrew/WQLK8xx+9bCoeji+jcLU2waq9dY6CB7R+BnFiYY4tzUQOoljtGT+EDvCGTol3KXKuIdHdainlFT7GAAAAAASUVORK5CYII=");
    background-repeat: no-repeat;
    background-position: center;
  }

  .area_control {
    background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAACzSURBVDiNpdCxagJREIXhbxfrQOzENGIatbRIa5E3sErhC0V8o6QJsqyK2OchNLhNOtPchWUhyN07cGCGy/ln7oEf3IJOWDTmezrneNC9Hnv/POzwiQmuQVN8YIU1Nuj3cEQWjN+osEWJc5ir0JcYoQgaZHhtbK4CZB7zjzqQAu/iQrw1M/jCIWYz5I1+jKcUQJ12Z8BvrLkNeMYwFtAOcZ9ywRuWKYAZXlIAnSrHJcF/+QMsgznBRrzUrgAAAABJRU5ErkJggg==");
    background-repeat: no-repeat;
    background-position: center;
  }

  .clear_control {
    background: url('data:image/svg+xml;utf8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="20" height="20">%3Cpath d="M10,3.4 c-0.8,0-1.5,0.5-1.8,1.2H5l-1,1v1h12v-1l-1-1h-3.2C11.5,3.9,10.8,3.4,10,3.4z M5,8v7c0,1,1,2,2,2h6c1,0,2-1,2-2V8h-2v5.5h-1.5V8h-3 v5.5H7V8H5z"/>%3C/svg>');
    background-repeat: no-repeat;
    background-position: center;
  }

  .export_control {
    background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAADeSURBVDiNndMxTgJBFAbgbxcqCysLEkugs/AIW9B5AzCx4x5cwANAzRHsJHgECypN6Oi0Fxsslo2zA6MsfzLJvD/v/TPvnzeZOi7xgAvHscEcu4poRwmP6GCVEBjti+cpgS4meEkIfKEfErHAf/iMiQw5hrjGGM9YnyBW+eFe2dc5a5Sj17CNAoP9vp83LIYWvqugqYmwCINzblBDG9uIe5IepBvcBfGW0sR3v84WfxxYBHlvysGrYXmCwDIkYg92SpdTaAk+EoevsMBUehK7mIVEdiTpFlcJgQ+8hsQPTFgym1kaFDIAAAAASUVORK5CYII=");
    background-repeat: no-repeat;
    background-position: center;
  }
</style>
