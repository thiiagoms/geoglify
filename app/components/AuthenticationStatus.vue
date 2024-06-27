<template>
  
  <Login :opened="openedLoginDialog" @update:opened="openedLoginDialog = $event"></Login>
  <Profile :opened="openedProfileDialog" @update:opened="openedProfileDialog = $event"></Profile>

  <v-btn class="position-absolute font-weight-bold text-body-2 text--uppercase"
    style="top: 10px; left: 10px; z-index: 1000" density="comfortable" rounded="lg" size="small"
    v-if="status === 'authenticated'" @click="openedProfileDialog = true" icon="mdi-account-circle"></v-btn>

  <v-btn class="position-absolute font-weight-bold text-body-2 text--uppercase"
    style="top: 10px; left: 10px; z-index: 1000" density="comfortable" rounded="lg" size="small" v-else
    @click="openedLoginDialog = true" icon="mdi-login"></v-btn>
</template>

<script>
const { status, data } = useAuth();

export default {
  data() {
    return {
      openedLoginDialog: false,
      openedProfileDialog: false,
    };
  },

  computed: {

    user() {
      return data?.value;
    },

    status() {
      return status?.value;
    },
  },
};
</script>
