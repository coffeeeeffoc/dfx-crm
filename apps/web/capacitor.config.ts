import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.dfx.crm",
  appName: "星谱 CRM",
  webDir: "dist-native",
  plugins: {
    SystemBars: {
      insetsHandling: "css",
      initialViewportFitValueHint: "cover",
      style: "LIGHT",
    },
  },
};

export default config;
