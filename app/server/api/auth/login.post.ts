export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig(event);
    const body = await readBody(event);

    return await $fetch(config.public.API_URL + "/auth/login", {
      method: "POST",
      body: body,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response("Login failed", { status: 401 });
  }
});
