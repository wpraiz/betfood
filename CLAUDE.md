# BetFood — POC de mini-games recompensadores em restaurantes (Natal/RN)

Webapp + APK (mesmo código): restaurantes parceiros distribuem códigos de mesa,
clientes jogam mini-games e ganham cupons reais. Gamificação de fidelidade — **sem
dinheiro real, sem aposta**; dopaminérgico no bom sentido, nunca predatório.

## Direção visual (decidida pelo José em 26/ago/2026, após várias iterações)

**Estilo iFood épico + lobby de jogos.** Interface CLARA (bg-paper #faf9f9),
vermelho vivo `brand-500 #ea1d2c` como cor de ação, âmbar `accent2 #f5a623` pra
prêmio/bônus, cards arredondados (`rounded-card` 1.25rem) com FOTO de comida,
sans bold (`font-display`). **PROIBIDO emoji na UI** — ícones são SVG inline.
Motion obrigatório: utilities `.anim-fade-up`, `.anim-pop`, `.press` em
`src/index.css` (+ `animationDelay` inline pra cascata). Home é **games-first**:
roleta-herói girando com luzes → thumbnails dos jogos → restaurantes.
Iterações rejeitadas (não voltar): tema escuro com emojis ("infantil"),
editorial serifado Broadsheet ("não tem cara de app").

## Stack

- Vite + React 18 + TS + Tailwind 4 (`@tailwindcss/vite`), HashRouter, Capacitor 7
- Dados: localStorage via `src/lib/store.ts` (única porta; schema Supabase espelhado em `supabase/schema.sql`)
- Som: `src/lib/sound.ts` — `play(name, {loop?, volume?})`/`stop(name)`; 13 SFX ElevenLabs em `public/sounds/` (spin, win, lose, scratch, coupon, tap, flip, correct, wrong, shimmer, levelup, tick, jackpot). Respeita mute, nunca lança.
- Fotos: `restaurant.photo` (Unsplash) + `restaurant.rating` no seed; sempre com skeleton shimmer no carregamento.

## Economia e progressão (store.ts)

- **Fichas** (moeda global): boas-vindas 50, jogada custa `CHIP_COST` 10, bônus diário +30 (`claimDailyBonus`), código da mesa credita `credits × 10` fichas.
- **XP/nível**: +10 por jogada, +25 por vitória; níveis Garfo de Bronze → Prata → Ouro → Chef da Casa → Lenda de Natal (`getProgress()`).
- **Streak**: dias seguidos jogando (qualquer casa).

## Arquitetura

- `src/lib/types.ts` — contratos. **`GameProps`/`GameDefinition` é o contrato de mini-game** (sem campo emoji).
- `src/games/<id>/index.tsx` — um game por pasta, registrado em `src/games/index.ts`. Games NÃO acessam store/rotas; só `drawPrize()` (fonte única do resultado) e `onFinish()` exatamente uma vez.
- `src/pages/GamePlay.tsx` — casca: consome fichas, monta o game, converte vitória em cupom.
- `/welcome` — splash + onboarding (flag `betfood-onboarded` no localStorage; redirect em App.tsx).

## Comandos

- `npm run dev` → http://localhost:5199 · `npm run build` → typecheck + build
- APK: skill `release-apk`. Novo jogo: skill `new-game`. Demo: skill `demo-poc`.

## Deploy

**URL oficial da POC: https://betfood.vercel.app** — é o alvo, não usar outra.

- GitHub: `origin` → https://github.com/wpraiz/betfood.git. A Vercel está ligada
  ao repo: **todo push em `main` vira deploy automático**. Não precisa build
  manual nem CLI; basta commitar e empurrar.
- Conferir se o deploy pegou: comparar o bundle servido
  (`curl -s https://betfood.vercel.app | grep -o 'assets/[^"]*\.js'`) com o
  `dist/index.html` local após `npm run build`.
- GitHub Pages foi um plano B abandonado (branch `gh-pages` apagada). Ignorar.

## Skills de design instaladas (.claude/skills)

`frontend-design` (Anthropic — ler antes de qualquer redesign), `ui-ux-pro-max`
(busca local: `python scripts/search.py "<query>" --domain style` — nesta máquina
é `python`, não `python3`), `web-design-guidelines` e `react-best-practices`
(auditorias Vercel). Use-as em qualquer trabalho de UI neste repo.

## Regras

- Texto pt-BR adulto e energético; perder = "não foi dessa vez", nunca punição/pressão.
- Sem dados de pessoa real em seed/testes.
- Som + motion em toda interação significativa; confetti nas vitórias (cores #ea1d2c #f5a623 #ffffff).
