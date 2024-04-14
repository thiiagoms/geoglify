<template>
  <div class="blue-grey lighten-5 text-no-wrap rounded">
    <v-btn depressed @click="skipBackward" class="mx-2" elevation="0" icon>
      <v-icon> mdi-skip-backward </v-icon>
    </v-btn>

    <v-btn depressed @click="rewind" class="mx-2" elevation="0" icon>
      <v-icon> mdi-rewind </v-icon>
    </v-btn>

    <v-btn
      depressed
      @click.stop="isPlaying ? pause() : play()"
      :color="isPlaying ? 'warning' : 'primary'"
      class="mx-2"
      fab
      dark
      small
      elevation="0"
    >
      <v-icon> {{ isPlaying ? "mdi-pause" : "mdi-play" }}</v-icon>
    </v-btn>

    <v-btn depressed @click="forward" class="mx-2" elevation="0" icon dark>
      <v-icon> mdi-fast-forward </v-icon>
    </v-btn>

    <v-btn depressed @click="skipForward" class="mx-2" elevation="0" icon>
      <v-icon> mdi-skip-forward </v-icon>
    </v-btn>

    <p>{{ currentTime }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      timer: null,
      currentTime: new Date(),
      speed: 1,
      isPlaying: false,
    };
  },
  methods: {
    play() {
      this.isPlaying = true;
      this.timer = setInterval(() => {
        const newTime = new Date(this.currentTime.getTime() + 1000); // 1000 milliseconds = 1 second
        this.currentTime =
          newTime.getTime() > Date.now() ? new Date() : newTime;
      }, 1000);
    },
    pause() {
      this.isPlaying = false;
      clearInterval(this.timer);
      this.timer = null;
    },
    rewind() {
      const oneHourAgo = new Date(this.currentTime.getTime() - 3600000); // 3600000 milliseconds = 1 hour
      this.currentTime = oneHourAgo;
    },
    skipBackward() {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setDate(twentyFourHoursAgo.getDate() - 1);
      this.currentTime = twentyFourHoursAgo;
    },
    forward() {
      const newTime = new Date(this.currentTime.getTime() + 3600000); // 3600000 milliseconds = 1 hour
      this.currentTime = newTime.getTime() > Date.now() ? new Date() : newTime;
    },
    skipForward() {
      this.currentTime = new Date();
    },
  },
  mounted() {
    this.play();
  },
  beforeUnmount() {
    this.pause();
  },
};
</script>
