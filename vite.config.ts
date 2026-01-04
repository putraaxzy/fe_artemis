import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "public",
      filename: "service-worker.js",
      registerType: "autoUpdate",
      includeAssets: ["batik.png"],
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        injectionPoint: undefined,
      },
      manifest: {
        name: "artemis - manajemen tugas",
        short_name: "artemis",
        description: "sistem manajemen tugas untuk siswa dan guru",
        theme_color: "#111827",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/batik.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
            form_factor: "narrow",
          },
          {
            src: "/batik.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
            form_factor: "wide",
          },
          {
            src: "/batik.png",
            sizes: "96x96",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/batik.png",
            sizes: "128x128",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/batik.png",
            sizes: "256x256",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
