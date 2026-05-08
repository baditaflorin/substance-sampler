import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as {
  version: string;
};

export default defineConfig({
  base: "/substance-sampler/",
  plugins: [react()],
  build: {
    outDir: "docs",
    emptyOutDir: false,
    assetsDir: "assets",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("three")) {
            return "three-preview";
          }
          if (id.includes("lucide-react")) {
            return "icons";
          }
          if (id.includes("@tanstack")) {
            return "query";
          }
          return undefined;
        }
      }
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __GIT_COMMIT__: JSON.stringify(process.env.VITE_GIT_COMMIT ?? "dev"),
    __REPO_URL__: JSON.stringify("https://github.com/baditaflorin/substance-sampler"),
    __PAYPAL_URL__: JSON.stringify("https://www.paypal.com/paypalme/florinbadita")
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["src/test/setup.ts"]
  }
});
