// capacitor.config.ts
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.hafizsyedahmedali.imposterword",
  appName: "Imposter Word",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      // The plugin's default auto-hide timer races the WebView's
      // first real paint -- on a cold start it can fire before Home
      // has actually rendered, which is exactly the black gap Android
      // Issue 2 reports. Turning autoHide off and calling
      // SplashScreen.hide() ourselves once the app has mounted (see
      // components/pwa/NativeSplashScreenController.tsx) closes that
      // gap deterministically instead of guessing a duration.
      launchAutoHide: false,
      backgroundColor: "#05051a",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;