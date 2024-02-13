<template>
  <Map></Map>
</template>
<script setup lang="ts">
const appName = "Geoglify";
const appDescription = "You're in the right place";

useHead({
  htmlAttrs: { lang: "en" },
  link: [
    { rel: "canonical", href: "https://geoglify.com/" },
    {
      rel: "icon",
      type: "image/png",
      sizes: "32x32",
      href: "/favicon-32x32.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "16x16",
      href: "/favicon-16x16.png",
    },
  ],
  title: appName,
  meta: [
    {
      name: "description",
      content: appDescription,
    },
    { property: "og:title", content: appName },
    {
      property: "og:description",
      content: appDescription,
    },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://geoglify.com" },
    { property: "og:locale", content: "en_US" },
    { property: "og:image", content: "https://geoglify.com/social.png" },
  ],
});
</script>
