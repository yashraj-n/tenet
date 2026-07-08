import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    nitro({
      rollupConfig: {
        external: ["@google-cloud/run", "google-gax"],
      },
      rolldownConfig: {
        external: ["@google-cloud/run", "google-gax"],
      },
      traceDeps: ["@google-cloud/run*", "google-gax*"],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  ssr: {
    external: ["@google-cloud/run", "google-gax"],
  },
  build: {
    rollupOptions: {
      external: ["@google-cloud/run", "google-gax"],
    },
  },
  server: {
    allowedHosts: ["crucial-decent-bluejay.ngrok-free.app"],
  },
});

export default config;
