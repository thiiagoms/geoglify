<template>
  <v-btn class="position-absolute font-weight-bold text-body-2 text--uppercase" style="top: 10px; left: 140px; z-index: 1000" size="small" @click="dialogOpened = true" prepend-icon="mdi-layers"> Layers </v-btn>
</template>

<script>
  export default {
    props: ["map"],

    computed: {
      dialogOpened: {
        get() {
          return this.$store.state.layers.listOpened;
        },
        set(value) {
          this.$store.state.layers.listOpened = value;
        },
      },
    },
  };
</script>
