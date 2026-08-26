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

## Regras de UI aprendidas na auditoria (valem pra tudo que for novo)

- **Contraste**: corpo `ink/70`, rótulos/metadados `ink/65`. Não usar `ink/30–50`
  como texto. `accent2` (#f5a623) **nunca** como cor de texto sobre fundo claro —
  use `#8a5a00`; accent2 fica em fundo, ícone e borda.
- **Toque**: todo alvo interativo com ≥44x44px de área (padding conta).
- **Safe-area**: topo com `pt-[env(safe-area-inset-top)]` (PWA no iPhone desenha
  sob o notch), rodapé com `pb-[env(safe-area-inset-bottom)]`.
- **Som**: nunca forçar `navigator.audioSession` — o app respeita o silencioso do
  aparelho, e o mudo do app fica no HUD e na barra do jogo.
- **Fotos**: sempre via `src/components/FoodPhoto.tsx` (trata erro e não deixa
  skeleton infinito); miniaturas com o helper `thumb(url, w)`.
- **Sem beco sem saída**: toda tela terminal precisa de pelo menos uma saída
  clara; o shell (HUD + tab bar) só some durante a partida — ver
  `ImmersiveContext` documentado em `src/components/Layout.tsx`.
- **Copy honesta**: não prometer prêmio garantido (40% do peso é "não foi dessa
  vez"); casas fictícias levam selo "Casa exemplo".

## Economia e progressão (store.ts)

- **Fichas** (moeda global): boas-vindas 50, jogada custa `CHIP_COST` 10, bônus diário +30 (`claimDailyBonus`), código da mesa credita `credits × 10` fichas.
- **XP/nível**: +10 por jogada, +25 por vitória; níveis Garfo de Bronze → Prata → Ouro → Chef da Casa → Lenda de Natal (`getProgress()`).
- **Streak**: dias seguidos jogando (qualquer casa).
- **Cupom** tem `expiresAt` (24h após o ganho).
- **Dados de demonstração**: a primeira visita nasce com histórico fictício
  (códigos e cupons marcados `demo: true`) pra o painel do parceiro não abrir
  zerado no pitch. `clearDemoData()` limpa antes de uma demo ao vivo;
  `hasDemoData()` diz se ainda existem.

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
