import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vercel в этом проекте ищет собранные файлы в папке build, а не dist.

const built = new Date();
const stamp =
  String(built.getUTCDate()).padStart(2, "0") + "." +
  String(built.getUTCMonth() + 1).padStart(2, "0") + " · " +
  String(built.getUTCHours()).padStart(2, "0") + ":" +
  String(built.getUTCMinutes()).padStart(2, "0");

export default defineConfig({
  define: { __BUILD_TIME__: JSON.stringify(stamp) },
  plugins: [react()],
  build: { outDir: "build" },
});
