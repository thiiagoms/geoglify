export default defineEventHandler(async (event) => {
  
  const config = useRuntimeConfig(event);
  const body = await readBody(event);

  return await $fetch(config.API_URL + "/ships/search", {
    method: "POST",
    body: body,
    headers: {
      "Content-Type": "application/json",
    },
  });
});
