export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig(event);
    const id = getRouterParam(event, "id");
    return await $fetch(config.public.API_URL + "/ship/" + id);
  } catch (error) {
    return null;
  }
});
