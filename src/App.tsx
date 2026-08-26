import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import RestaurantPage from "./pages/RestaurantPage";
import GamePlay from "./pages/GamePlay";
import Wallet from "./pages/Wallet";
import Partner from "./pages/Partner";
import Welcome from "./pages/Welcome";

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
        <Route path="/r/:restaurantId/jogar/:gameId" element={<GamePlay />} />
        <Route path="/cupons" element={<Wallet />} />
        <Route path="/parceiro" element={<Partner />} />
      </Route>
    </Routes>
  );
}
