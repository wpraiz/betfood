import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import RestaurantPage from "./pages/RestaurantPage";
import GamePlay from "./pages/GamePlay";
import Wallet from "./pages/Wallet";
import Partner from "./pages/Partner";
import Welcome from "./pages/Welcome";

/**
 * Ir de um jogo para outro casa na MESMA rota (`/r/:id/jogar/:gameId`), então o
 * React Router reaproveitaria a instância de GamePlay: o resultado da rodada
 * anterior ficaria na tela e a nova jogada não seria cobrada (o ref de cobrança
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
  );
}
