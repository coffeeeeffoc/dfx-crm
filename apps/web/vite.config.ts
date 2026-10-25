import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const native = mode === "native";
  return {
    base: native ? "/" : process.env.VITE_BASE_PATH || "/",
    plugins: [
      react(),
      VitePWA({
        disable: native,
        injectRegister: false,
        registerType: "prompt",
        includeAssets: ["icons/*.png", "icons/*.svg"],
        manifest: {
          id: "./",
          name: "星谱 CRM",
          short_name: "星谱 CRM",
          description: "客户、项目与业务协作工作台",
          lang: "zh-CN",
          start_url: "./",
          scope: "./",
          display: "standalone",
          theme_color: "#3866dc",
          background_color: "#f5f7fb",
          icons: [
            { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
            {
              src: "icons/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html}"],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          navigateFallbackDenylist: [/\/api(?:\/|$)/],
        },
      }),
    ],
    build: { outDir: native ? "dist-native" : "dist" },
    server: {
      port: 5173,
      strictPort: true,
      fs: {
        deny: [
          "**/.env*",
          "**/materials/**",
          "**/transcripts/**",
          "**/.cache/**",
        ],
      },
    },
  };
});
