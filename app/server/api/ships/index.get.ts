export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig(event);
    return await $fetch(config.public.API_URL + "/ships");
  } catch (error) {
    return [];
  }
});
