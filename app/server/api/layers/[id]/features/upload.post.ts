import { defineEventHandler, parseCookies } from "h3";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);

  const cookies = parseCookies(event);
  const token = cookies["auth.token"];

  const formDataBody = await readMultipartFormData(event);
  const formData = new FormData();

  // Append the data to a new FormData (need to convert Buffer into string / Blob)
  formDataBody?.forEach((value) => {
    if (value.name && value.data) {
      if (value.name === "file") {
        const blob = new Blob([value.data], { type: value.type });
        formData.append(value.name, blob);
      } else {
        formData.append(value.name, value.data.toString());
      }
    }
  });

  return await $fetch(config.public.GEOAPI_URL + "/layers/" + event.context.params.id + "/features", {
    method: "POST",
    body: formData,
    headers: {
      Authorization: "Bearer " + token,
    },
  });
});
