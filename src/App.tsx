import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import RestaurantPage from "./pages/RestaurantPage";
import GamePlay from "./pages/GamePlay";
import Wallet from "./pages/Wallet";
import Partner from "./pages/Partner";

export default function App() {
  return (
    <Routes>
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
