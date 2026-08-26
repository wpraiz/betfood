# BetFood — POC de mini-games recompensadores em restaurantes (Natal/RN)

Webapp + APK (mesmo código) onde restaurantes parceiros distribuem códigos de mesa
e clientes jogam mini-games leves pra ganhar cupons reais. **Nada de aposta com
dinheiro** — é gamificação de fidelidade, tom divertido e não agressivo.

## Stack

- Vite + React 18 + TypeScript + Tailwind 4 (`@tailwindcss/vite`)
- React Router (HashRouter — funciona igual na web e dentro do APK)
- Capacitor 7 pra gerar o APK Android a partir do `dist/`
- Dados: **localStorage** via `src/lib/store.ts` (POC offline). O schema Supabase
  equivalente está em `supabase/schema.sql` pra quando sair do mock — trocar o
  backend é reescrever só o `store.ts`.

## Comandos

- `npm run dev` — dev server em http://localhost:5199
- `npm run build` — typecheck + build de produção
- `npm run apk:sync` — build + sync no projeto Android (requer `npx cap add android` na 1ª vez + Android Studio)

## Arquitetura

- `src/lib/types.ts` — contratos centrais. **`GameProps`/`GameDefinition` é o contrato de todo mini-game.**
- `src/lib/store.ts` — única porta de dados (jogadas, códigos de mesa, cupons, sorteio por peso). Nunca acessar localStorage fora daqui.
- `src/lib/seed.ts` — restaurantes fictícios da POC (todos dados inventados, sem pessoa real).
- `src/games/<id>/index.tsx` — um mini-game por pasta; exporta `GameDefinition`; registrado em `src/games/index.ts`.
- `src/pages/GamePlay.tsx` — casca comum: consome a jogada, monta o game, transforma `onFinish` em cupom. **Games não mexem em store nem em rota** — só chamam `drawPrize()` e `onFinish()` uma vez.

## Regras do projeto

- Mobile-first, tela máx. `max-w-md`, tema escuro (`--color-ink`), acento laranja (`brand-*`).
- Texto de UI em pt-BR, tom leve. Recompensa sempre positiva: perder = "não foi dessa vez", nunca punição.
- Sem dados de pessoas reais em seed/testes — nomes e restaurantes fictícios.
- Novo mini-game: usar a skill `new-game` (em `.claude/skills/`).
