export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const id = getRouterParam(event, 'id');
  return await $fetch(config.public.API_URL + "/ship/" + id);
});
