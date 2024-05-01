<template>
  <v-dialog max-width="500" v-model="dialogOpened">
    <v-card class="pa-3">
      <v-card-title class="py-0 my-0">
        <v-list class="text-center">
          <v-list-item>
            <v-list-item-title class="text-h5 font-weight-black">Welcome to Geoglify!</v-list-item-title>
            <v-list-item-subtitle class="text-caption font-weight-bold">You're in the right sea</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card-title>
      <v-card-text class="mb-5">
        <v-form v-model="form" @submit.prevent="onSubmit">
          <v-text-field v-model="email" :readonly="loading" :rules="[required]" class="mb-2" label="Email" placeholder="Enter your email" clearable variant="outlined"></v-text-field>
          <v-text-field v-model="password" type="password" :readonly="loading" :rules="[required]" label="Password" placeholder="Enter your password" clearable variant="outlined"></v-text-field>
          <v-btn :disabled="!form" :loading="loading" color="blue-grey-darken-3" size="large" type="submit" variant="flat" block class="mt-2"> Login </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<script>
  export default {
    props: ["opened"],
    data() {
      return {
        form: false,
        email: null,
        password: null,
        loading: false,
      };
    },
    computed: {
      dialogOpened: {
        get() {
          return this.opened;
        },
        set(value) {
          this.opened = value;
        },
      },
    },
    methods: {
      required(v) {
        return !!v || "Field is required";
      },
      onSubmit() {
        if (!this.form) return;

        this.loading = true;

        this.$store
          .dispatch("auth/LOGIN", { email: this.email, password: this.password })
          .then(() => {
            this.loading = false;
          })
          .catch(() => {
            this.loading = false;
          });
      },
    },
  };
</script>
