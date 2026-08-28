import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Identidade do build: entra no `index.html` como meta e num `version.json`
// ao lado. Comparar os dois é como o app descobre que está rodando uma versão
// velha (ver src/components/AvisoDeVersao.tsx).
//
// Por que na meta e NÃO dentro do bundle: um id que muda a cada build mudaria
// o conteúdo do JS, e com ele o hash do arquivo. Aí `assets/index-XXXX.js`
// nunca mais bateria entre o build local e o da Vercel — que é exatamente como
// se confere se um deploy saiu (regra do CLAUDE.md, aprendida nas 18h perdidas
// do ciclo 46).
const BUILD_ID = Date.now().toString(36);

export default defineConfig({
  // base relativa: funciona na raiz (Vercel), em subpasta (GitHub Pages) e no APK
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "betfood-version",
      transformIndexHtml() {
        return [
          {
            tag: "meta",
            attrs: { name: "betfood-build", content: BUILD_ID },
            injectTo: "head",
          },
        ];
      },
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
