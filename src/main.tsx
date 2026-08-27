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
  warm();
});
