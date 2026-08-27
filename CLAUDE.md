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
- Som: `src/lib/sound.ts` — `play(name, {loop?, volume?})`/`stop(name)`; 13 SFX ElevenLabs em `public/sounds/` (spin, win, lose, scratch, coupon, tap, flip, correct, wrong, shimmer, levelup, tick, jackpot). Respeita mute, nunca lança. `warm(names?)` pré-baixa os MP3 (chamado no `load` em `src/main.tsx`).
- Fotos: `restaurant.photo` (Unsplash) + `restaurant.rating` no seed; sempre com skeleton shimmer no carregamento.
- **Offline: `public/sw.js`** (service worker sem libs, cache versionado `betfood-v1`).
  Registrado em `src/main.tsx` só em `import.meta.env.PROD` — o dev server (5199)
  nunca tem SW. Navegação é network-first (versão nova nunca fica presa em cache);
  assets same-origin (`/assets/`, `/sounds/`, `/icons/`) são cache-first com
  revalidação em background; requests cross-origin (Unsplash, fontes) passam
  direto, sem interceptação. Responde `Range` com um 206 real — sem isso o
  `<audio>` do Safari recusa o MP3 vindo do cache. **Ao mudar o precache, suba a
  versão do cache** (`betfood-v1` → `-v2`), senão o cliente antigo não limpa.
  Efeito colateral útil e verificado: depois da primeira visita os chunks dos
  jogos vêm do SW, então a latência do lazy-load some.

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
- **Cupom** tem `expiresAt` (24h após o ganho). A validação no caixa mora em
  `store.ts`, não na página: `findCouponByCode(restaurantId, code)` (busca
  case-insensitive e ignorando espaços, escopada por casa),
  `redeemCouponByCode(restaurantId, code)` → `RedeemByCodeResult` (`ok` |
  `nao-encontrado` | `ja-usado` | `expirado`, com o cupom junto pra tela mostrar
  data), `getPendingCoupons(restaurantId)` e os auxiliares `couponExpiresAt` /
  `isCouponExpired` (fallback `wonAt + 24h` pra cupom antigo sem `expiresAt`).
  Nunca duplicar essa regra de prazo na UI.
- **Dados de demonstração**: a primeira visita nasce com histórico fictício
  (códigos e cupons marcados `demo: true`) pra o painel do parceiro não abrir
  zerado no pitch. `clearDemoData()` limpa antes de uma demo ao vivo;
  `hasDemoData()` diz se ainda existem.
  **Regra de leitura (não quebre)**: `getCoupons()` é a carteira DO JOGADOR e
  filtra `demo`; `getRestaurantCoupons()`/`getPendingCoupons()` são a visão DA
  CASA e incluem. Os cupons de demonstração representam clientes anteriores do
  restaurante — se vazarem pra carteira, quem abre o app encontra prêmios que
  nunca ganhou (aconteceu; ver STATUS ciclo 9).

## Arquitetura

- `src/lib/types.ts` — contratos. **`GameProps`/`GameDefinition` é o contrato de mini-game** (sem campo emoji).
- `src/games/<id>/index.tsx` — um game por pasta, com **`export default` do componente** (nada de `GameDefinition` aqui). Os metadados estáticos (id/name/tagline) e o loader `import()` moram em `src/games/index.ts`, que embrulha o componente em `React.lazy` — é isso que dá **um chunk por jogo**. Games NÃO acessam store/rotas; só as props.
- **`startPlay()` — regra permanente da cobrança justa.** A ficha sai no gesto que
  REALMENTE inicia a rodada (girar a roleta, a primeira raspada, o "Valendo" do
  quiz, a primeira carta da memória), **nunca na montagem**: abrir o jogo pra ver
  como é e voltar não pode custar ficha. Retorna `false` quando não há saldo — aí
  o jogo não começa e o GamePlay troca sozinho pra tela "Suas fichas acabaram".
  É idempotente por rodada (`chargedRef` no GamePlay), mas chame uma vez só.
  Sortear o prêmio (`drawPrize()`) é de graça e pode acontecer na montagem.
- `src/pages/GamePlay.tsx` — casca: cobra a ficha via `startPlay`, monta o game
  dentro de um `<Suspense>` com esqueleto (nunca tela branca), converte vitória
  em cupom. O shell (HUD + tab bar) só some durante a partida de verdade.
- `prefetchGame(id)` em `src/games/index.ts` aquece o chunk antes da navegação
  (`onPointerDown` no card) — helper pronto, ainda não ligado nas listagens.
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

## Compartilhamento (o link é o funil)

O José divulga colando a URL no WhatsApp. `index.html` tem as tags Open
Graph/Twitter com **URL absoluta** (robôs de preview não resolvem caminho
relativo) apontando pra `public/og.png` (1200x630). Pra regerar a imagem:
sirva `scripts/og-card.html` pelo dev server (copie pra `public/`, abra
`http://localhost:5199/<arquivo>.html`), tire screenshot em 1200x630 e salve
como `public/og.png` — o protocolo `file:` é bloqueado no playwright-cli.
Mudou nome, cor ou proposta do app? Regere a imagem.

## Skills de design instaladas (.claude/skills)

`frontend-design` (Anthropic — ler antes de qualquer redesign), `ui-ux-pro-max`
(busca local: `python scripts/search.py "<query>" --domain style` — nesta máquina
é `python`, não `python3`), `web-design-guidelines` e `react-best-practices`
(auditorias Vercel). Use-as em qualquer trabalho de UI neste repo.

## Regras

- Texto pt-BR adulto e energético; perder = "não foi dessa vez", nunca punição/pressão.
- Sem dados de pessoa real em seed/testes.
- Som + motion em toda interação significativa; confetti nas vitórias (cores #ea1d2c #f5a623 #ffffff).
