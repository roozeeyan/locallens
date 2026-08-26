import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vercel в этом проекте ищет собранные файлы в папке build, а не dist.
export default defineConfig({
  plugins: [react()],
  build: { outDir: "build" },
});
