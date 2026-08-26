import { Link, Outlet, useLocation } from "react-router-dom";
import Hud from "./Hud";

const lineProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** Cada tab tem variante de linha (inativa) e preenchida (ativa). */
const ICONS: Record<string, { line: React.ReactNode; fill: React.ReactNode }> = {
  restaurantes: {
    line: (
      <svg {...lineProps} className="h-6 w-6">
        <path d="M7 3v7a2 2 0 0 0 2 2v9" />
        <path d="M5 3v4M9 3v4" />
        <path d="M16 3c-1.5 1.5-2 3.5-2 6 0 2 .5 3 2 3v9" />
      </svg>
    ),
    fill: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
        <path d="M8 2.25c.55 0 1 .45 1 1V7h.75V3.25a1 1 0 0 1 2 0V9a3 3 0 0 1-2.25 2.9V21a1 1 0 0 1-2 0v-9.1A3 3 0 0 1 5.25 9V3.25a1 1 0 0 1 2 0V7H8V3.25c0-.55 0-1 0-1Z" />
        <path d="M16.6 2.4c.4-.4 1.15-.1 1.15.5V21a1 1 0 0 1-2 0v-8.2c-1.2-.5-1.75-1.9-1.75-3.8 0-2.8 1.1-5.1 2.6-6.6Z" />
      </svg>
    ),
  },
  cupons: {
    line: (
      <svg {...lineProps} className="h-6 w-6">
        <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1.5a2.5 2.5 0 0 0 0 5V16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1.5a2.5 2.5 0 0 0 0-5V8Z" />
        <path d="M14 6v12" strokeDasharray="2.5 2.5" />
      </svg>
    ),
    fill: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
        <path
          fillRule="evenodd"
          d="M5 6a2 2 0 0 0-2 2v1.5a2.5 2.5 0 0 1 0 5V16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1.5a2.5 2.5 0 0 1 0-5V8a2 2 0 0 0-2-2H5Zm9 1.25c.41 0 .75.34.75.75v1.2a.75.75 0 0 1-1.5 0V8c0-.41.34-.75.75-.75Zm.75 4.15a.75.75 0 0 0-1.5 0v1.2a.75.75 0 0 0 1.5 0v-1.2ZM14 14.8c.41 0 .75.34.75.75V16.2a.75.75 0 0 1-1.5 0v-.65c0-.41.34-.75.75-.75Z"
        />
      </svg>
    ),
  },
  parceiro: {
    line: (
      <svg {...lineProps} className="h-6 w-6">
        <path d="M4 10v9h16v-9" />
        <path d="M3 6l1.5-3h15L21 6a2.4 2.4 0 0 1-4.5 1A2.4 2.4 0 0 1 12 7a2.4 2.4 0 0 1-4.5 0A2.4 2.4 0 0 1 3 6Z" />
        <path d="M9 19v-5h6v5" />
      </svg>
    ),
    fill: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
        <path d="M3 6l1.5-3h15L21 6a2.4 2.4 0 0 1-4.5 1A2.4 2.4 0 0 1 12 7a2.4 2.4 0 0 1-4.5 0A2.4 2.4 0 0 1 3 6Z" />
        <path d="M4 9.6c.5.28 1.07.44 1.68.44.87 0 1.7-.31 2.37-.85a3.93 3.93 0 0 0 3.95.02 3.93 3.93 0 0 0 3.95-.02c.67.54 1.5.85 2.37.85.61 0 1.18-.16 1.68-.44V19a1 1 0 0 1-1 1h-4.25v-5.25h-5.5V20H5a1 1 0 0 1-1-1V9.6Z" />
      </svg>
    ),
  },
};

export default function Layout() {
  const { pathname } = useLocation();
  const tab = (to: string, label: string, icon: string) => {
    const active = pathname === to;
    return (
      <Link
        to={to}
        aria-current={active ? "page" : undefined}
        className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors duration-200 ${
          active ? "text-brand-500" : "text-ink/40"
        }`}
      >
        <span
          className={`transition-transform duration-200 ${active ? "scale-105" : "scale-100"}`}
        >
          {active ? ICONS[icon].fill : ICONS[icon].line}
        </span>
        {label}
      </Link>
    );
  };
  // Dentro do jogo o app sai de cena: sem HUD, sem tab bar — só a partida.
  const immersive = pathname.includes("/jogar/");

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-paper text-ink">
      {!immersive && <Hud />}
      <main className={`flex-1 ${immersive ? "" : "pb-24"}`}>
        <Outlet />
      </main>
      {!immersive && (
        <nav className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t border-ink/10 bg-white pb-[env(safe-area-inset-bottom)]">
          <div className="flex">
            {tab("/", "Início", "restaurantes")}
            {tab("/cupons", "Cupons", "cupons")}
            {tab("/parceiro", "Parceiro", "parceiro")}
          </div>
        </nav>
      )}
    </div>
  );
}
