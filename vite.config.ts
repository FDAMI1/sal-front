import { fileURLToPath, URL } from "node:url";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const dir = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig(({ mode }) => {
  // VITE_API_URL is baked into the bundle at build time. Without it a Vercel
  // build would ship a site calling http://localhost:5000, which fails for
  // every visitor; failing the build names the missing setting instead.
  if (process.env.VERCEL && !loadEnv(mode, process.cwd()).VITE_API_URL) {
    throw new Error(
      "VITE_API_URL is not set. Add it in Vercel → Project Settings → Environment Variables (e.g. https://your-api.vercel.app/api/v1).",
    );
  }

  return {
    plugins: [react(), tailwindcss()],
    // Same alias set as the reference app, so module imports read the same way.
    resolve: {
      alias: {
        "@api": dir("./src/shared/api"),
        "@modules": dir("./src/modules"),
        "@navigation": dir("./src/navigation"),
        "@shared": dir("./src/shared"),
        "@config": dir("./src/config"),
      },
    },
    server: { port: 5173, strictPort: true },
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      include: ["src/**/*.test.{ts,tsx}"],
      env: { VITE_API_URL: "http://api.test/api/v1" },
    },
  };
});
