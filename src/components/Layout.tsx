import { Link, Outlet, useLocation } from "react-router-dom";

export default function Layout() {
  const { pathname } = useLocation();
  const tab = (to: string, label: string, emoji: string) => {
    const active = pathname === to;
    return (
      <Link
        to={to}
        className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition-colors ${
          active ? "text-brand-500" : "text-white/50"
        }`}
      >
        <span
          className={`flex h-8 w-14 items-center justify-center rounded-full text-xl transition-all ${
            active ? "bg-brand-500/15 shadow-[0_0_16px_-2px_var(--color-brand-500)]" : ""
          }`}
        >
          {emoji}
        </span>
        {label}
        {active && <span className="absolute -top-px h-0.5 w-8 rounded-full bg-brand-500" />}
      </Link>
    );
  };
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-ink text-white">
      <main className="flex-1 pb-24">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t border-white/10 bg-ink/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="flex">
          {tab("/", "Restaurantes", "🍽️")}
          {tab("/cupons", "Meus Cupons", "🎟️")}
          {tab("/parceiro", "Parceiro", "🏪")}
        </div>
      </nav>
    </div>
  );
}
