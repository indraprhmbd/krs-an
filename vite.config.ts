import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: true,
    rolldownOptions: {
      output: {
        // Rolldown deprecates the manualChunks object form in favour of
        // advancedChunks. test matches the module path, so anchor on
        // node_modules and allow both path separators for Windows.
        advancedChunks: {
          groups: [
            {
              name: "react-vendor",
              test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
            },
            {
              name: "ui-vendor",
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            },
            {
              name: "clerk-vendor",
              test: /[\\/]node_modules[\\/]@clerk[\\/]/,
            },
            {
              name: "convex-vendor",
              test: /[\\/]node_modules[\\/]convex[\\/]/,
            },
          ],
        },
      },
    },
  },
});
