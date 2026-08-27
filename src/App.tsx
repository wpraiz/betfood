import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import RestaurantPage from "./pages/RestaurantPage";
import GamePlay from "./pages/GamePlay";
import Wallet from "./pages/Wallet";

// Telas fora do caminho quente saem do bundle inicial: o painel do parceiro só
// interessa ao restaurante e o onboarding roda uma vez na vida do aparelho.
const Partner = lazy(() => import("./pages/Partner"));
const Welcome = lazy(() => import("./pages/Welcome"));

/** Espera de rota: barra viva no lugar do branco, sem pular o layout. */
function RouteFallback() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6" aria-busy="true">
      <div className="h-12 w-12 animate-pulse rounded-full bg-brand-500/20" />
      <div className="h-3 w-40 animate-pulse rounded-full bg-ink/10" />
      <p className="text-xs font-semibold text-ink/65">Carregando…</p>
    </div>
  );
}

/**
 * Ir de um jogo para outro casa na MESMA rota (`/r/:id/jogar/:gameId`), então o
 * React Router reaproveitaria a instância de GamePlay: o resultado da rodada
 * anterior ficaria na tela e a rodada nova nasceria já paga (o ref de cobrança
 * sobrevive). A key força a remontagem a cada par casa+jogo.
 */
function KeyedGamePlay() {
  const { restaurantId = "", gameId = "" } = useParams();
  return <GamePlay key={`${restaurantId}/${gameId}`} />;
}

export default function App() {
  const { pathname } = useLocation();
  const onboarded = localStorage.getItem("betfood-onboarded") === "1";
  if (!onboarded && pathname !== "/welcome") return <Navigate to="/welcome" replace />;

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/welcome" element={<Welcome />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/r/:restaurantId" element={<RestaurantPage />} />
          <Route path="/r/:restaurantId/jogar/:gameId" element={<KeyedGamePlay />} />
          <Route path="/cupons" element={<Wallet />} />
          <Route path="/parceiro" element={<Partner />} />
        </Route>
        {/* Hash desconhecido nunca vira tela branca: volta pra Home. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
