<template>
  <v-dialog max-width="500" v-model="dialogOpened" v-if="!!user">
    <v-card>
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
        </v-list>
      </v-card-text>

      <v-card-actions class="px-10 py-5">
        <v-btn :loading="loading" color="black" size="large" type="submit" variant="flat" block @click="logout">Logout</v-btn>
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
        return data.value;
      },

      lastRefreshedAtValue() {
        return lastRefreshedAt.value;
      },
    },

    methods: {
      // Helper method to format date
      formatDate(date) {
        return date ? new Date(date).toLocaleString("en-GB", { timeZone: "UTC" }) : "";
      },

      async logout() {
        this.loading = true;

        await signOut({ redirect: false });

        this.dialogOpened = false;

        this.loading = false;
      },
    },
  };
</script>
