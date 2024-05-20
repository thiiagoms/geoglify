<template>
  <v-dialog max-width="500" v-model="dialogOpened" v-if="!!user">
    <v-card :loading="loading">
      <v-card-title>
        <v-list>
          <v-list-item>
            <v-list-item-title class="text-h5 font-weight-bold">Welcome back!</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-title>
      <v-card-text>
        <v-list>
          <v-list-item>
            <v-list-item-title class="text-h6"
              >Name: <b>{{ user.name }}</b></v-list-item-title
            >
          </v-list-item>
          <v-list-item>
            <v-list-item-title class="text-h6"
              >Email: <b>{{ user.email }}</b></v-list-item-title
            >
          </v-list-item>

          <v-list-item>
            <v-list-item-title class="text-h6"
              >Last refreshed at: <b>{{ formatDate(lastRefreshedAtValue) }}</b></v-list-item-title
            >
          </v-list-item>

          <v-list-item>
            <v-text-field type="password" v-model="user.password" outlined clearable placeholder="New Password" required variant="outlined"></v-text-field>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-card-actions class="px-10 py-5">
        <v-btn :disabled="loading" type="submit" variant="flat" @click="update">Update</v-btn>
        <v-btn :disabled="loading" type="submit" variant="flat" @click="logout">Logout</v-btn>
        <v-spacer></v-spacer>
        <v-btn text @click="dialogOpened = disabled" :disabled="loading">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
  const { data, signOut, lastRefreshedAt } = useAuth();

  export default {
    props: ["opened"],

    data() {
      return {
        loading: false,
      };
    },

    computed: {
      dialogOpened: {
        get() {
          return this.opened;
        },
        set(value) {
          this.$emit("update:opened", value);
        },
      },

      user() {
        if (!!data?.value) return JSON.parse(JSON.stringify(data.value));
        else return null;
      },

      lastRefreshedAtValue() {
        return lastRefreshedAt.value;
      },
    },

    methods: {
      // Helper method to format date
      formatDate(date) {
        return date ? new Date(date).toLocaleString({ timeZone: "UTC" }) : "";
      },

      async logout() {
        this.loading = true;

        await signOut({ redirect: false });

        this.dialogOpened = false;

        this.loading = false;
      },

      async update() {
        this.loading = true;

        const config = useRuntimeConfig();
        const token = useCookie("auth.token");

        // Update the user
        await $fetch(config.public.API_URL + "/auth/update", {
          method: "PUT",
          body: JSON.stringify(this.user),
          headers: {
            Authorization: "Bearer " + token.value,
          },
        });

        this.logout();

        this.loading = false;
      },
    },
  };
</script>
