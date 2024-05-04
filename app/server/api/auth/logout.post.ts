export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig(event);

    return await $fetch(config.public.GEOAPI_URL + "/auth/logout", {
      method: "POST",
      headers: {
        Authorization: event.req.headers?.authorization,
      },
    });
  } catch (error) {
    return new Response("Logout failed", { status: 401 });
  }
});
