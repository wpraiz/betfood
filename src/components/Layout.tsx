import { Link, Outlet, useLocation } from "react-router-dom";

export default function Layout() {
  const { pathname } = useLocation();
  const tab = (to: string, label: string, emoji: string) => (
    <Link
      to={to}
      className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
        pathname === to ? "text-brand-500" : "text-white/50"
      }`}
    >
      <span className="text-xl">{emoji}</span>
      {label}
    </Link>
  );
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-ink text-white">
      <main className="flex-1 pb-20">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-1/2 flex w-full max-w-md -translate-x-1/2 border-t border-white/10 bg-ink/95 backdrop-blur">
        {tab("/", "Restaurantes", "🍽️")}
        {tab("/cupons", "Meus Cupons", "🎟️")}
        {tab("/parceiro", "Parceiro", "🏪")}
      </nav>
    </div>
  );
}
