import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [devtools(), nitro({}), tailwindcss(), tanstackStart(), viteReact()],
  server: {
    allowedHosts: ["fb9f-123-201-245-150.ngrok-free.app"],
  },
});

export default config;
