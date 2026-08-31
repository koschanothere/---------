const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react");
const path = require("node:path");

module.exports = defineConfig({
  plugins: [react()],
  root: ".",
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    watch: {
      ignored: ["**/release/**", "**/dist/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src/renderer"),
    },
  },
});
