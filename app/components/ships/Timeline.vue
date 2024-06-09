<template>
  <v-card class="pa-2">
    <v-slider v-model="sliderVal" track-color="grey" always-dirty :max="max" :min="min" hide-details @end="setSliderValue">
      <template v-slot:prepend>
        <v-btn depressed @click.stop="togglePlayPause" :color="isPlaying ? 'warning' : 'black'" size="small" icon dark elevation="0" :title="isPlaying ? 'Stop' : 'Start'">
          <v-icon> {{ isPlaying ? "mdi-pause" : "mdi-play" }}</v-icon>
        </v-btn>

        <v-btn depressed @click="decrease(1440)" class="mx-2" elevation="0" icon title="Rewind 24 hours">
          <v-icon> mdi-rewind </v-icon>
        </v-btn>

        <v-btn depressed @click="decrease(60)" class="mx-2" elevation="0" icon title="Rewind 30 minutes">
          <v-icon> mdi-rewind-60 </v-icon>
        </v-btn>

        <v-btn depressed @click="decrease(30)" class="mx-2" elevation="0" icon title="Rewind 15 minutes">
          <v-icon> mdi-rewind-30 </v-icon>
        </v-btn>

        <v-btn depressed @click="decrease(5)" class="mx-2" elevation="0" icon title="Rewind 5 minutes">
          <v-icon> mdi-rewind-5 </v-icon>
        </v-btn>
      </template>

      <template v-slot:append>
        <v-btn depressed @click="increase(5)" class="mx-2" elevation="0" icon title="Fast forward 5 minutes">
          <v-icon> mdi-fast-forward-5 </v-icon>
        </v-btn>

        <v-btn depressed @click="increase(30)" class="mx-2" elevation="0" icon title="Fast forward 30 minutes">
          <v-icon> mdi-fast-forward-30 </v-icon>
        </v-btn>

        <v-btn depressed @click="increase(60)" class="mx-2" elevation="0" icon title="Fast forward 1 hour">
          <v-icon> mdi-fast-forward-60 </v-icon>
        </v-btn>

        <v-btn depressed @click="increase(1440)" class="mx-2" elevation="0" icon title="Time now">
          <v-icon> mdi-fast-forward </v-icon>
        </v-btn>
      </template>
    </v-slider>
  </v-card>
</template>
<script>
  const DEFAULT_INCREMENT = "minutes";
  export default {
    data() {
      return {
        isPlaying: false,
        val: 0,
        min: 0,
        max: 0,
        playTimeout: null,
        events: null,
        sliderVal: 0,
      };
    },
    computed: {
      sliderIncrement() {
        return DEFAULT_INCREMENT;
      },
    },
    watch: {
      startDate() {
        this.reboot();
      },
      endDate() {
        this.reboot();
      },
    },
    mounted() {
      this.reboot();
    },
    beforeDestroy() {
      this.reboot();
    },
    methods: {
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
      decrease(val) {
        this.sliderVal = this.sliderVal - val > this.min ? this.sliderVal - val : this.min;
      },

      increase(val) {
        this.sliderVal = this.sliderVal + val < this.max ? this.sliderVal + val : this.max;
      },

      play() {
        clearTimeout(this.playTimeout);
        this.sliderVal++;
        console.log(this.sliderVal, this.max)
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
        this.val = 0;
        this.min = 0;
        this.max = 60;
        this.sliderVal = 0;
        this.isPlaying = false;
        clearTimeout(this.playTimeout);
      },
    },
  };
</script>
<style>
  .v-slider--horizontal {
    margin-top: 10px;
  }
</style>
