import { Link, Outlet, useLocation } from "react-router-dom";

const ICONS: Record<string, React.ReactNode> = {
  restaurantes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="h-5 w-5">
      <path d="M7 3v7a2 2 0 0 0 2 2v9" />
      <path d="M5 3v4M9 3v4" />
      <path d="M16 3c-1.5 1.5-2 3.5-2 6 0 2 .5 3 2 3v9" />
    </svg>
  ),
  cupons: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1.5a2.5 2.5 0 0 0 0 5V16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1.5a2.5 2.5 0 0 0 0-5V8Z" />
      <path d="M14 6v12" strokeDasharray="2.5 2.5" />
    </svg>
  ),
  parceiro: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M4 10v9h16v-9" />
      <path d="M3 6l1.5-3h15L21 6a2.4 2.4 0 0 1-4.5 1A2.4 2.4 0 0 1 12 7a2.4 2.4 0 0 1-4.5 0A2.4 2.4 0 0 1 3 6Z" />
      <path d="M9 19v-5h6v5" />
    </svg>
  ),
};

export default function Layout() {
  const { pathname } = useLocation();
  const tab = (to: string, label: string, icon: string) => {
    const active = pathname === to;
    return (
      <Link
        to={to}
        className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors ${
          active ? "text-brand-600" : "text-ink/40"
        }`}
      >
        {active && <span className="absolute top-0 h-0.5 w-10 bg-brand-500" />}
        {ICONS[icon]}
        {label}
      </Link>
    );
  };
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-paper text-ink">
      <main className="flex-1 pb-24">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t border-ink/10 bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="flex">
          {tab("/", "Casas", "restaurantes")}
          {tab("/cupons", "Cupons", "cupons")}
          {tab("/parceiro", "Parceiro", "parceiro")}
        </div>
      </nav>
    </div>
  );
}
