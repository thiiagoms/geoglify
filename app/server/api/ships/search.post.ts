export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig(event);
    const body = await readBody(event);

    return await $fetch(config.public.API_URL + "/ships/search", {
      method: "POST",
      body: body,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return [];
  }
});
