<template>
  <Login :opened="openedLoginDialog" @update:opened="updateOpenedLoginDialogState"></Login>
  <Profile :opened="openedProfileDialog" @update:opened="updateOpenedProfileDialogState"></Profile>

  <v-btn v-if="status === 'authenticated'" @click="openedProfileDialog = true" variant="outlined" size="small" prepend-icon="mdi-account-circle">{{ user.name }}</v-btn>
  <v-btn v-else @click="openedLoginDialog = true" variant="outlined" size="small" prepend-icon="mdi-login">Login</v-btn>
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
        return data.value;
      },

      status() {
        return status.value;
      },
    },

    methods: {
      updateOpenedLoginDialogState(value) {
        this.openedLoginDialog = value;
      },

      updateOpenedProfileDialogState(value) {
        this.openedProfileDialog = value;
      },
    },
  };
</script>
