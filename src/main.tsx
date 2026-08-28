import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { warm } from "./lib/sound";
import "./index.css";

// HashRouter: funciona igual no webapp e dentro do APK (Capacitor) sem config de server.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);

// Depois que a tela já pintou: SW (abre offline) + MP3 em disco (som na hora certa).
window.addEventListener("load", () => {
  // Só em produção — em dev o SW serviria bundle velho e mataria o HMR.
  if (import.meta.env.PROD && "serviceWorker" in navigator) {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  }
  // Só o que pode tocar nos primeiros segundos: `tap` (toque de UI) e `coupon`
  // (o slide 2 do onboarding celebra sozinho). 48 KB em vez de 452 — o resto
  // chega em prefetchGame, quando o dedo encosta no card do jogo.
  warm(["tap", "coupon"]);

  // Rede de segurança da promessa offline: quem fica com o app aberto acaba com
  // os 13 SFX em disco de qualquer jeito, só que fora do caminho crítico.
  // Espera de RELÓGIO, não `requestIdleCallback`: a thread principal fica ociosa
  // ~1s depois da carga, quando as fotos ainda estão descendo. Ocioso de CPU não
  // é ocioso de rede — medido no ciclo 63, o adiamento por idle não adiantou
  // nada. 15s é tempo de sobra pra tudo que é visível já ter chegado.
  window.setTimeout(() => warm(), 15_000);
});
