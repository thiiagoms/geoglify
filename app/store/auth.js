export const state = () => ({
  user: null,
});

export const mutations = {
  login(state, { user }) {
    state.user = user;
  },
  logout(state) {
    state.user = null;
  },
};

export const actions = {
  LOGIN({ commit }, payload) {
    
    return new Promise(async (resolve) => {
      
      const user = await $fetch("/api/auth", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      commit("login", user);
      resolve(user);
      
    });
  },
  LOGOUT({ commit }) {
    commit("logout");
  },
};
