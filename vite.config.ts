import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type PluginOption } from "vite";
import { twd } from "twd-js/vite-plugin";
import { twdRemote } from "twd-relay/vite";
import istanbul from "vite-plugin-istanbul";

export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    reactRouter(),
    // TWD only runs against the dev server; production builds stay clean.
    ...(command === "serve"
      ? [
          twd({ testFilePattern: "/**/*.twd.test.{ts,tsx}", serviceWorker: false }),
          twdRemote() as PluginOption,
          // Instruments app code only when CI is set (npm run dev:ci) for twd-cli coverage.
          istanbul({
            include: "app/**",
            exclude: ["node_modules", "app/twd-tests/**", "**/*.server.ts"],
            extension: [".ts", ".tsx"],
            requireEnv: !process.env.CI,
          }),
        ]
      : []),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    // Fixed port: twd.config.json points here, and silently moving to another
    // port would run the tests against whatever else is on 5173.
    port: 5180,
    strictPort: true,
    watch: { ignored: ["**/.twd/**", "**/.nyc_output/**", "**/coverage/**"] },
    warmup: {
      clientFiles: ["./app/twd-tests/**/*.twd.test.{ts,tsx}", "./app/root.tsx"],
    },
  },
  optimizeDeps: {
    include: ["twd-js/bundled", "twd-relay/browser"],
  },
}));
