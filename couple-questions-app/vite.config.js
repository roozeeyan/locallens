import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Метка сборки: по ней видно, какая версия реально открылась на телефоне.
// Без неё «не доехало» и «не работает» неотличимы друг от друга.
const BUILD = new Date().toISOString().slice(0, 16).replace("T", " ");

export default defineConfig({
  plugins: [react()],
  define: { __BUILD__: JSON.stringify(BUILD) },
});
