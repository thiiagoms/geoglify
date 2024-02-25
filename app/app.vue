<template>
  <VitePwaManifest />
  <div class="h-screen">
    <div id="loading-wrapper" v-if="isLoading">
      <img class="logo" src="@/assets/logo.png"  alt="" width="120" height="120">
    </div>

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style>
body,
html {
  overflow: hidden;
}
</style>
<script >
export default {
  data() {
    return {
      loading: true,
    };
  },
  setup() {
    const shipsStoreInstance = shipsStore();
    return { shipsStoreInstance };
  },
  computed: {
    isLoading() {
      return this.shipsStoreInstance.isLoading;
    },
  },
};
</script>
<style>
#loading-wrapper {
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  background-color: aliceblue;
  position: absolute;
  z-index: 10000;
}

.logo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120px;
  height: 120px;
  margin: -60px 0 0 -60px;
  -webkit-animation: spin 4s linear infinite;
  -moz-animation: spin 4s linear infinite;
  animation: spin 4s linear infinite;
}
@-moz-keyframes spin {
  100% {
    -moz-transform: rotate(-360deg);
  }
}
@-webkit-keyframes spin {
  100% {
    -webkit-transform: rotate(-360deg);
  }
}
@keyframes spin {
  100% {
    -webkit-transform: rotate(-360deg);
    transform: rotate(-360deg);
  }
}
</style>
