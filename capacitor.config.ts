import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.momin.noorulislam",
  appName: "MOMIN",
  webDir: "www",
  backgroundColor: "#0d0c0a",
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false
  }
};

export default config;
