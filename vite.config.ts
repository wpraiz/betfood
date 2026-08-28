import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Identidade do build. Vai pra dentro do bundle (`__BUILD_ID__`) e pra um
// `version.json` ao lado — comparar os dois é como o app descobre que está
// rodando uma versão velha (ver src/components/AvisoDeVersao.tsx).
const BUILD_ID = Date.now().toString(36);

export default defineConfig({
  // base relativa: funciona na raiz (Vercel), em subpasta (GitHub Pages) e no APK
  base: "./",
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "betfood-version-json",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "version.json",
          source: JSON.stringify({ id: BUILD_ID }),
        });
      },
    },
  ],
  server: { port: 5199 },
});
