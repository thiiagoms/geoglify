export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig(event);

    return await $fetch(config.public.GEOAPI_URL + "/auth/me", {
      method: "GET",
      headers: {
        Authorization: event.req.headers?.authorization,
      },
    });
  } catch (error) {
    console.log("Me failed", error);
    return new Response("Me failed", { status: 401 });
  }
});
