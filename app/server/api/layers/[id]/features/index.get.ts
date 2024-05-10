import { defineEventHandler, parseCookies } from "h3";

export default defineEventHandler(async (event) => {
  
  const config = useRuntimeConfig(event)
  const cookies = parseCookies(event);
  const token = cookies["auth.token"];

  return await $fetch(config.public.GEOAPI_URL + "/layers/" + event.context.params.id + "/features", {
    method: "GET",
    headers: {
      Authorization: "Bearer " + token,
    },
  });
});
