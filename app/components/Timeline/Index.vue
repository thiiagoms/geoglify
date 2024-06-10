<template>

  <v-bottom-sheet v-model="isEnable" opacity="0" :scrim="false" persistent>

    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" class="position-absolute font-weight-bold text-body-2 text--uppercase"
        :color="isEnable ? 'primary' : 'dark'" style="top: 10px; left: 10px; z-index: 1000" rounded="lg"
        density="comfortable" size="small" icon="mdi-history"></v-btn>

    </template>

    <v-card class="pa-2">
      <v-card-title class="text-center font-weight-bold">{{ formatDate(new Date(sliderVal)) }}</v-card-title>
      <v-slider v-model="sliderVal" track-color="grey" always-dirty :max="max" :min="min" hide-details
        @end="setSliderValue">
        <template v-slot:prepend>
          <v-btn depressed @click.stop="togglePlayPause" :color="isPlaying ? 'warning' : 'black'" icon dark size="large"
            elevation="0" :title="isPlaying ? 'Stop' : 'Start'">
            <v-icon> {{ isPlaying ? "mdi-pause" : "mdi-play" }}</v-icon>
          </v-btn>

          <v-btn depressed @click="decrease(1440)" class="mx-2" elevation="0" icon title="Rewind 24 hours" rounded="lg">
            <v-icon> mdi-rewind </v-icon>
          </v-btn>

          <v-btn depressed @click="decrease(30)" class="mx-2" elevation="0" icon title="Rewind 15 minutes" rounded="lg">
            <v-icon> mdi-rewind-30 </v-icon>
          </v-btn>

          <v-btn depressed @click="decrease(5)" class="mx-2" elevation="0" icon title="Rewind 5 minutes" rounded="lg">
            <v-icon> mdi-rewind-5 </v-icon>
          </v-btn>
        </template>

        <template v-slot:append>
          <v-btn depressed @click="increase(5)" class="mx-2" elevation="0" icon title="Fast forward 5 minutes"
            rounded="lg">
            <v-icon> mdi-fast-forward-5 </v-icon>
          </v-btn>

          <v-btn depressed @click="increase(30)" class="mx-2" elevation="0" icon title="Fast forward 30 minutes"
            rounded="lg">
            <v-icon> mdi-fast-forward-30 </v-icon>
          </v-btn>


          <v-btn depressed @click="increase(1440)" class="mx-2" elevation="0" icon title="Time now" rounded="lg">
            <v-icon> mdi-fast-forward </v-icon>
          </v-btn>

          <!-- increase speed -->
          <v-btn depressed @click="toggleSpeed()" class="mx-2 font-weight-black" elevation="0" icon title="Toggle speed"
            size="small" variant="tonal" rounded="lg">
            x{{ speed }}
          </v-btn>

        </template>
      </v-slider>
    </v-card>
  </v-bottom-sheet>
</template>

<script>
import { debounce } from "lodash";

export default {
  props: ["enable"],

  data() {
    return {
      isPlaying: false,
      min: 0,
      max: 0,
      playTimeout: null,
      sliderVal: 0,
      speed: 1,
    };
  },
  computed:
  {
    isEnable: {
      get() {
        return this.enable;
      },
      set(value) {
        this.$emit('update:enable', value);
      }
    }
  },
  watch: {
    sliderVal(val) {
      fetch(`https://api.example.com/v1/history?timestamp=${val}`)
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
        });
    },
    isEnable(val) {
      if (val) {
        this.reboot();
      }
    }
  },
  beforeDestroy() {
    clearTimeout(this.playTimeout);
  },
  methods: {
    // Helper method to format date
    formatDate(date) {
      return date ? new Date(date).toLocaleString({ timeZone: "UTC" }) : "";
    },
    setSliderValue(value) {
      this.sliderVal = value;
    },
    togglePlayPause() {
      this.isPlaying = !this.isPlaying;
      if (this.isPlaying) {
        this.play();
      } else {
        this.stop();
      }
    },
    decrease: debounce(function (val) {
      this.sliderVal = this.sliderVal - val * 60 * 1000 > this.min ? this.sliderVal - val * 60 * 1000 : this.min;
    }, 300),

    increase: debounce(function (val) {
      this.sliderVal = this.sliderVal + val * 60 * 1000 < this.max ? this.sliderVal + val * 60 * 1000 : this.max;
    }, 300),

    play() {
      clearTimeout(this.playTimeout);
      this.sliderVal += 1000 * this.speed;
      this.playTimeout = setTimeout(() => {
        if (this.sliderVal >= this.max) {
          this.stop();
        } else {
          this.play();
        }
      }, 1000);
    },
    stop() {
      clearTimeout(this.playTimeout);
      this.isPlaying = false;
    },
    reboot() {
      const now = Date.now();
      this.min = now - 24 * 60 * 60 * 1000;
      this.max = now;
      this.sliderVal = this.min;
      this.isPlaying = false;
      clearTimeout(this.playTimeout);
    },
    // increase speed 1, 2, 5, 10, 20
    toggleSpeed() {
      if (this.speed === 1) {
        this.speed = 2;
      } else if (this.speed === 2) {
        this.speed = 5;
      } else if (this.speed === 5) {
        this.speed = 10;
      } else if (this.speed === 10) {
        this.speed = 20;
      } else {
        this.speed = 1;
      }
    },
  },
};
</script>

<style>
.v-slider--horizontal {
  margin-top: 10px;
}
</style>
