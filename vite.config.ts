import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // base relativa: funciona na raiz (Vercel), em subpasta (GitHub Pages) e no APK
  base: "./",
  plugins: [react(), tailwindcss()],
  server: { port: 5199 },
});
