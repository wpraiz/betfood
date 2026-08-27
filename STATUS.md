# STATUS — BetFood POC

Atualizado: 2026-08-27 (madrugada — fim do ciclo 4 do loop de melhoria)

## O que estávamos fazendo

POC completa pra apresentação de hoje com o Allan: app de mini-games
recompensadores pra restaurantes de Natal. Dia inteiro de iteração de design
guiada pelo José até travar em: **iFood épico, claro, sem emoji, games-first,
dopaminérgico** (fichas, XP, streak, som, motion).

## Pronto (commitado em main, GitHub wpraiz/betfood)

- App completo: onboarding /welcome, Home com fotos, 4 games (roleta, raspadinha, quiz, memória), carteira de cupons, painel do parceiro.
- 13 SFX ElevenLabs em public/sounds + src/lib/sound.ts.
- Economia de fichas + XP/níveis + streak em src/lib/store.ts.
- 6 skills em .claude/skills (frontend-design, ui-ux-pro-max, web-design-guidelines, react-best-practices, new-game, release-apk, demo-poc).
- CLAUDE.md atualizado com a direção visual e as regras.

## Em andamento / próxima ação

1. Ciclo 4 commitado e empurrado pra `main` → deploy automático na Vercel.
   **Conferir o deploy**: `curl -s https://betfood.vercel.app | grep -o
   'assets/[^"]*\.js'` deve bater com o `dist/index.html` local.
2. **Primeira visita depois do deploy instala o service worker.** Abrir
   betfood.vercel.app uma vez antes de qualquer demo — é o que garante a POC
   funcionando com wi-fi ruim.
3. Próximo ciclo: ver "Backlog restante" do ciclo 4 (iPhone real, offline no
   celular, near-miss/ritmo dos jogos).

## No ar

**https://betfood.vercel.app** (deploy automático a cada push em main).
Games repaginados, modo imersivo, HUD de fichas/XP/streak, near-miss na roleta —
tudo publicado e verificado sem erro de console.

## Ciclo 4 (loop de melhoria) — 26/ago, madrugada

Dois agentes em paralelo + verificação final. Fecha os itens 1, 2 e 3 do backlog
do ciclo 3 (lazy-load dos games, service worker/offline, cobrança justa).

### O que mudou

**Cobrança justa — a ficha só sai quando a rodada começa**
- `src/lib/types.ts`: nova prop `GameProps.startPlay: () => boolean`. Contrato
  permanente, documentado no CLAUDE.md e na skill `new-game`.
- `src/pages/GamePlay.tsx`: a montagem não cobra mais nada — só OLHA o saldo
  (`availablePlays`) pra decidir se já mostra "fichas acabaram". `startPlay`
  cobra via `consumePlay` uma única vez por rodada (`chargedRef`, sobrevive ao
  double-render do StrictMode) e devolve `false` sem saldo. State `chips` novo
  pra o contador da barra reagir à cobrança.
- Os 4 jogos chamam `startPlay()` no gesto real: roleta em `spin()`, raspadinha
  no `handlePointerDown`, quiz no "Valendo", memória no primeiro `handleFlip`.
- Bônus diário na tela de fichas esgotadas agora só credita e devolve o jogo;
  a ficha sai quando a rodada começar.
- `inMatch` passou a incluir rota/jogo inválido — erro sem tab bar era beco.

**Lazy-load por jogo (`src/games/index.ts` reescrito)**
- Cada `src/games/<id>/index.tsx` virou `export default <Componente>`; os
  metadados (id/name/tagline) ficaram estáticos no registry, com
  `component: lazy(loaders.<id>)`. As listagens mostram os 4 jogos sem baixar
  nenhum. Novo helper `prefetchGame(id)` (pronto, ainda não ligado nos cards).
- `GamePlay` monta o jogo dentro de `<Suspense>` com `GameSkeleton`.
- `src/App.tsx`: `Partner` e `Welcome` também em `React.lazy`, `<Routes>` dentro
  de um `<Suspense>`.

**Service worker / offline (`public/sw.js`, novo — sem libs)**
- Cache versionado `betfood-v1`: precache do shell, dos 4 ícones e dos 13 MP3.
  Navegação network-first (versão nova nunca fica presa), assets same-origin
  cache-first com revalidação, cross-origin sem interceptação, `Range` respondido
  com 206 real (Safari recusa MP3 servido como 200 inteiro).
- Registrado em `src/main.tsx` só em `PROD`; `warm()` novo em `src/lib/sound.ts`
  pré-baixa os sons no `load`.

### Números do bundle (`npm run build`)

| | Antes (ciclo 3) | Depois |
|---|---|---|
| Bundle principal | **313,42 kB** | **251,60 kB** (gzip 79,71 kB) |

Queda de **61,82 kB (-19,7%)** no que o app baixa pra abrir. Chunks novos, sob
demanda: roleta 8,12 kB · memória 8,17 kB · raspadinha 9,57 kB · quiz 16,01 kB ·
Welcome 9,32 kB · Partner 13,96 kB.

### Verificação

`npm run build` limpo (60 módulos, sem erro) e `npx tsc --noEmit -p
tsconfig.app.json` exit 0. Chrome 390x844 no dev server, estado zerado
(`betfood-onboarded=1`, 50 fichas):
- **Cobrança justa**: abrir a roleta e sair sem jogar → fichas seguem **50**.
  Voltar e clicar "Girar agora" → **40**, resultado com cupom, HUD e tab bar de
  volta. Raspadinha: abrir → 40 intacto; primeira raspada → **30**, prêmio
  entregue. Quiz: abrir → 30 intacto; "Valendo" → **20**. Memória: abrir → 20
  intacto; primeira carta → **10**.
- **Sem fichas**: `chips=0` → "Suas fichas acabaram" com as três saídas, HUD
  (0 fichas, Nv.1 Bronze, Bônus +30) e tab bar visíveis. Resgatar o bônus
  credita 30 e devolve o jogo na hora, **sem cobrar**.
- **Suspense**: com rede a 6 kB/s no dev server, o fallback aparece como
  esqueleto pulsante + "Preparando o jogo…" **com a barra do jogo já pintada**
  (voltar, título, mudo, fichas). Nunca tela branca.
- **Service worker** (preview de produção, `vite preview --port 5188`): 1 SW
  `activated`, cache `betfood-v1` com **24 entradas**; com a rede desligada o app
  abre inteiro e navega. Só as fotos do Unsplash falham (cross-origin, tratadas
  pelo `FoodPhoto`).
- Console: **0 erro, 0 warning** nas três sessões.

Screenshots: `C:\tmp\c4-roleta-aberta.png`, `C:\tmp\c4-roleta-resultado.png`,
`C:\tmp\c4-raspadinha-resultado.png`, `C:\tmp\c4-quiz-pergunta.png`,
`C:\tmp\c4-sem-fichas.png`, `C:\tmp\c4-suspense-skeleton.png`,
`C:\tmp\c4-offline.png`.

### Backlog restante

1. **Ligar o `prefetchGame` nos cards** — 1 linha em `src/pages/Home.tsx` e em
   `src/pages/RestaurantPage.tsx` (`onPointerDown={() => prefetchGame(g.id)}`).
   Baixa prioridade: o SW já mata a latência a partir da segunda visita.
2. **Validar em iPhone real** — safe-area, alvos de 44px e o input de código a
   375px seguem sendo aposta de código.
3. **Testar offline no celular** — verificado no Chrome desktop; falta o iPhone
   (e confirmar se o SW registra no APK Capacitor, `capacitor://localhost`).
4. **Near-miss / ritmo dos jogos** — a roleta tem near-miss; raspadinha, quiz e
   memória ainda não têm a tensão equivalente.
5. Elevar o nível visual dos games além da roleta (item 1 do backlog do José).
6. Cupom expirado nunca sai da carteira — decisão de produto.
7. Som ambiente (`shimmer`) ainda começa ao ABRIR o jogo, não ao iniciar a
   rodada. Mantido de propósito; amarrar ao `startPlay` é opcional.

## Ciclo 3 (loop de melhoria) — 26/ago, noite

Dois agentes em paralelo + verificação final. Fecha os itens 1, 2 e 7 do backlog
do ciclo 1 (validar cupom no painel, tela "Como funciona", validade do cupom).

### O que mudou

**Validação de cupom no caixa (`src/lib/store.ts`, `src/pages/Partner.tsx`)**
- `findCouponByCode`, `redeemCouponByCode`, `getPendingCoupons`,
  `couponExpiresAt`, `isCouponExpired` — regra de prazo (24h, com fallback
  `wonAt + 24h` pra cupom antigo) mora só no store; a página não recalcula nada.
- `redeemCouponByCode` devolve `ok` | `nao-encontrado` | `ja-usado` | `expirado`
  **com o cupom junto**, pra tela dizer *quando* foi usado ou expirou. Só o
  caminho `ok` grava `redeemedAt`.
- Painel: bloco "Validar cupom" acima das métricas (input em maiúsculas, Enter
  valida), card verde com prêmio + som + confetti no sucesso, card vermelho com
  motivo e saída no erro, lista "Cupons pendentes desta casa" (toque preenche o
  código), "Limpar dados de demonstração" com confirmação inline.
- Semente de demonstração passou a gerar 4 cupons por casa (1 pendente, 2
  resgatados, 1 expirado) — antes nenhum cupom nascia pendente e não havia como
  demonstrar uma validação bem-sucedida no pitch.

**Tela "Como funciona" (`src/components/HowItWorks.tsx`, novo)**
- Bottom sheet com 6 passos explicando a economia de FICHAS (custo da jogada,
  50 de boas-vindas, +30 diário, código da mesa, cupom na carteira, prazo de
  24h) e selo âmbar "Sem dinheiro real, sem aposta" — o app se chama BetFood e
  isso precisa estar dito na primeira tela de dúvida.
- Fecha no X (44px), no toque fora, no Esc e no "Entendi"; trava o scroll do
  body; foco vai pro X ao abrir. Renderizado **fora** do `<header>` sticky do
  HUD (o header cria contexto de empilhamento e prenderia o overlay).
- Entradas: botão "?" no HUD e card no fim da Home.
- Correção da verificação: o "Entendi" ficava abaixo da dobra a 390x844 (cortado
  pela borda da tela). Virou rodapé fixo do sheet, fora da área rolável.

**Validade visível na carteira (`src/pages/Wallet.tsx`)**
- Chip "Vale até HH:MM de hoje / de amanhã / de DD/MM"; estado **Expirado** com
  visual próprio (carimbo em tinta, faixa cinza distinta do "Usado", sem botão
  "Marcar usado"). Contador de ativos exclui expirados; tick de 30s reavalia o
  vencimento sem recarregar.

### Verificação

`npm run build` limpo. Chrome 390x844 com estado zerado: painel do parceiro
mostra o bloco de validação e 1 cupom pendente; toque no pendente preenche o
código → **Validar** dá sucesso (métrica "Cupons resgatados" 2 → 3, cupom vira
"Usado" na carteira); o mesmo código de novo → "Esse cupom já foi usado em
26/08/2026 às 20:44"; `XXXXXX` → "Código não encontrado nesta casa". Sheet abre
pelo HUD e pela Home, fecha no X, no toque fora e no Esc, com o selo visível.
Console: 0 erro, 0 warning.
Screenshots: `C:\tmp\c3-validacao-ok.png`, `C:\tmp\c3-validacao-erro.png`,
`C:\tmp\c3-sheet-aberto.png`.

### Backlog restante

1. **Lazy-load dos games** — bundle único de 313 kB; cada jogo devia entrar por
   `React.lazy`.
2. **Service worker / offline** — PWA instalada ainda não abre sem rede (cache
   headers já estão no `vercel.json`).
3. **Cobrar ficha só no início real da partida** — hoje a ficha sai na montagem
   da tela; sair antes de jogar queima ficha.
4. **Validar em iPhone real** — safe-area, alvos de 44px e o input de código com
   `tracking` largo a 375px seguem sendo aposta de código.
5. Elevar o nível visual dos games além da roleta (item 1 do backlog do José).
6. Cupom expirado nunca sai da carteira — bom pro pitch (mostra a regra de 24h),
   ruim em uso longo. Decisão de produto.

## Ciclo 1 (loop de melhoria) — 26/ago, noite

Auditoria da POC → 3 agentes corrigindo em paralelo + verificação final
(build limpo, teste real em Chrome 390x844, console sem erro nem warning).

### O que mudou

**Robustez de navegação**
- `src/App.tsx`: rota `*` → `<Navigate to="/" replace />`. Hash desconhecido
  nunca mais vira tela branca (verificado: `/#/pagina-que-nao-existe-123` → Home).
- `src/App.tsx`: `KeyedGamePlay` remonta o GamePlay por `restaurantId/gameId`.
  Sem isso, ir de um jogo para outro reaproveitava a instância — o resultado da
  rodada anterior ficava na tela e a nova jogada não era cobrada.

**Modo imersivo (fim do beco sem saída)**
- `src/components/Layout.tsx`: `ImmersiveContext` com override carimbado por
  rota (expira sozinho na troca de pathname, sem effect no pai).
- `src/pages/GamePlay.tsx`: consome o contexto — shell some durante a partida,
  volta nas telas de resultado e de fichas esgotadas.
- Tela "Suas fichas acabaram" com três saídas: resgatar bônus (+30, começa a
  partida na hora), gerar código no painel do parceiro, voltar ao início.

**iPhone / PWA**
- `pt-[env(safe-area-inset-top)]` no HUD e na barra do jogo (notch / Dynamic Island).
- Botão de mudo (44x44, `aria-pressed`) no HUD e na barra do jogo.
- Removido o `navigator.audioSession.type = "playback"` de `src/lib/sound.ts` —
  o app volta a respeitar o silencioso do aparelho.
- Alvos de toque a 44px: sair do jogo, mudo, bônus, dots do onboarding, "Pular",
  "Marcar usado", steppers e chips do painel do parceiro, resgate de código.

**Acessibilidade e contraste (AA)**
- Corpo `ink/60` → `ink/70`; rótulos e metadados `ink/30–45` → `ink/65`.
- `accent2` (#f5a623) nunca mais como cor de texto sobre fundo claro — virou
  âmbar escuro `#8a5a00`; accent2 fica só em fundo, ícone e borda.
- Verde de acerto do quiz #22a06b → #1a7f52 (reprovava AA como texto e como
  fundo de texto branco).
- `@media (prefers-reduced-motion: reduce)` em `src/index.css` zerando as
  animações próprias e os `animate-pulse` infinitos.

**Performance e vazamentos**
- `src/components/FoodPhoto.tsx` (novo): componente único de foto com
  loading/ok/error — o skeleton para de pulsar quando a imagem falha e cai num
  bloco estático com a inicial da casa. Substituiu 5 cópias espalhadas.
  Atributo emitido como `fetchpriority` minúsculo (React 18 não conhece a prop
  camelCase e jogava erro no console).
- Fotos do seed de `w=900&q=80` → `w=600&q=70&fm=webp`, miniaturas via
  `thumb(url, w)`, `preconnect` para images.unsplash.com no `index.html`.
- Timers com `timeoutsRef` + cleanup no quiz e na raspadinha — rodada
  abandonada não credita mais cupom.
- Raspadinha: `getImageData` num offscreen 96x52 (era o canvas inteiro) e DPR
  limitado a 2.

**Copy honesta (a POC vai ser mostrada a donos de restaurante)**
- "Gire por prêmios de verdade · 10 fichas"; selo "Casa exemplo" nos cards;
  "{n} casas de exemplo"; "Casas de exemplo · Natal/RN" no onboarding.
- Seed: "Camarões do Potengi" → "Potengi Camaroeira" (id preservado, sem reset
  de estado nas instalações existentes).

### Verificação

`npm run build` limpo. Chrome 390x844, console com 0 erro e 0 warning.
Screenshots: `C:\tmp\c1-1-rota-inexistente-home.png`,
`C:\tmp\c1-2-partida-sem-shell.png`, `C:\tmp\c1-3-resultado-com-shell.png`,
`C:\tmp\c1-4-sem-fichas.png`.

Não validado em iPhone real — safe-area e toque de 44px seguem sendo aposta de
código até o playtest com os amigos.

### Backlog do ciclo 1 (achados não implementados)

1. **Validar cupom no painel do parceiro** — hoje o dono não tem como conferir
   nem baixar um código apresentado pelo cliente.
2. **Tela "Como funciona"** — explicação curta do fluxo fichas → jogo → cupom.
3. **Dados de demonstração no painel do parceiro** — números zerados não vendem
   a ideia na apresentação.
4. **Lazy-load dos games** — bundle único de 294 kB; cada jogo devia entrar por
   `React.lazy`.
5. **Service worker** — PWA instalada não abre offline. (Os *cache headers* já
   entraram neste ciclo, em `vercel.json`: assets imutáveis por 1 ano, sons e
   ícones por 7 dias.)
6. **Cobrar ficha só no início real da partida** — hoje a ficha sai na montagem
   da tela; sair antes de jogar queima ficha.
7. **Validade do cupom** — cupom nasce sem prazo; falta data e estado de expirado.

## Ciclo 5 — o link é o funil (26/ago, noite)

Tema: transformar link colado no WhatsApp em toque, e toque em app instalado.

- **Prévia do link**: `public/og.png` (1200x630, roleta + proposta) + tags Open
  Graph/Twitter com URL absoluta em `index.html`. Antes o link aparecia pelado.
  Fonte da imagem em `scripts/og-card.html` (como regerar está no CLAUDE.md).
- **Dica de instalação no iPhone** (`src/components/InstallHint.tsx`): Safari não
  oferece instalar; a faixa só aparece em iOS Safari fora do standalone, depois
  da 1ª interação (ou 8s), com o caminho Compartilhar → Adicionar à Tela de
  Início, dispensável pra sempre. Não monta durante a partida.
- **Convite** (`src/components/ShareButton.tsx`): card "Chame a galera" na Home,
  `navigator.share` → clipboard → URL selecionável (nenhum caminho morre).
- **HUD**: com mudo + ajuda + bônus a barra ficou apertada e o nível truncava
  ("NV.1 BRO..."). Removido o número de XP (a barra já mostra) e o prefixo
  "Nv.N" — agora só "BRONZE", que cabe a 390px.
- `.gitignore`: `*.tsbuildinfo` (dois artefatos estavam versionados à toa).

Verificado no browser (390x844), console limpo. **A dica de instalação e o
compartilhamento nativo só dá pra validar no iPhone real.**

## Ciclos 6-8 — sessão que não morre + argumento de venda + telas estreitas

**Ciclo 6 — fichas se recuperam sozinhas.** O teste com amigos morria em ~5min
(50 fichas = 5 jogadas, depois só no dia seguinte). Agora `store.ts` credita
`REGEN_AMOUNT` 10 a cada `REGEN_INTERVAL_MS` 10min até o teto `REGEN_CAP` 50
(fichas de código da mesa ficam acima do teto e não somem). `msToNextChip()`
alimenta a contagem no HUD e na tela de fichas esgotadas, que se libera sozinha
quando a ficha cai. Cuidado tomado: no teto o relógio não corre e só regrava
depois de um intervalo — senão o HUD (poll de 700ms) gravaria sem parar.

**Ciclo 6 — painel do parceiro vira argumento.** "Como funciona na prática" em
3 passos numerados (cada passo aponta o bloco correspondente da própria tela) e
"Por que ter o BetFood na casa" (colapsável, 4 pontos) — todos os números vêm do
próprio app, nenhuma estatística de mercado inventada.

**Ciclo 7 — HUD adaptativo.** Com mudo + ajuda + bônus + contador, a linha não
cabia e o nível truncava. Agora: saldo curto → contador entra e o nome do nível
sai; saldo folgado → nome volta.

**Ciclo 8 — varredura em tela estreita (iPhone SE, 375px).** Nenhuma tela
estoura na horizontal e nenhum alvo de toque abaixo de 44px em Home, carteira,
parceiro e jogos. Único ajuste: o nome do nível some abaixo de 400px
(`min-[400px]`) em vez de aparecer cortado. Também verificado na tela: memória
vira carta com foto e cobra a ficha só na primeira carta.

## Ciclo 9 — cupons de demonstração vazavam pra carteira do jogador

Bug introduzido no ciclo 2 (semente de demonstração) e só encontrado agora, numa
varredura com estado zerado: quem abria o app pela primeira vez ia em "Meus
cupons" e via **16 cupons que nunca ganhou**, vários já usados/expirados. Num app
que precisa provar que o prêmio é real, isso derruba a credibilidade logo na
primeira impressão — e nenhum dos ciclos anteriores pegou porque eu sempre
testava com estado já usado.

Correção em `store.ts`: `getCoupons()` (carteira do jogador) filtra `demo`;
`getRestaurantCoupons()` e `getPendingCoupons()` (visão da casa) continuam
incluindo, que é o motivo de existirem. Verificado nos dois lados: carteira nova
mostra o estado vazio com CTA "Ir jogar"; painel do parceiro segue com métricas
e 1 cupom pendente pra validar ao vivo.

## Ciclo 10 — jornada de estreia percorrida em produção

Método (o que achou o bug do ciclo 9): estado zerado, site publicado, caminho
exato de um amigo recebendo o link. Funcionou ponta a ponta — onboarding →
Home → roleta → cupom `ZDUXM4` → validação no caixa ("Resgatado agora"), com
fichas caindo 50→40 e o cupom entrando na carteira.

Única fricção encontrada: o herói "Girar agora" abre "Jogar em qual casa?" e
quem nunca usou não tem base pra escolher (só via nome, bairro e nota). Agora
cada casa mostra o **prêmio máximo** (é o que decide) e há a saída "Tanto faz,
escolhe por mim" — a escolha virou desejo em vez de obstáculo.

Nota de ferramenta (pra não perder tempo de novo): o playwright-cli não navega
de https://betfood.vercel.app para http://localhost (ERR_ABORTED) — é preciso
`playwright-cli close` e abrir de novo no destino. Cliques por `getByRole` com
nome acessível são mais confiáveis que refs de snapshot, que expiram a cada
re-render.

## Ciclo 11 — os quatro jogos verificados em produção (e dois alarmes falsos)

Faltava provar que quiz, raspadinha e memória **terminam** (só a roleta tinha
sido jogada até o fim). Resultado, tudo em https://betfood.vercel.app:

- **Quiz**: 3/3 acertos, feedback verde na correta e vermelho na escolhida
  errada, placar animado até o valor certo. Nada quebrado.
- **Raspadinha**: raspagem simulada por PointerEvents revela o resultado, chama
  onFinish, entra XP e aparece o caminho de recuperação.
- **Memória**: limite de 20 jogadas encerra a partida corretamente; ficha
  cobrada uma única vez (200 → 190).
- **Roleta**: já verificada no ciclo 10 (cupom ganho e validado no caixa).

**Dois alarmes falsos meus**, registrados porque quase viraram "correção" de
código que estava certo: (1) "o quiz não conta acertos" — na verdade as
perguntas estouravam o timer de 15s enquanto eu media entre comandos de CLI;
(2) "o placar final mostra 0" — era a contagem animada (380ms por ponto) lida
no instante zero. Método correto (agora no CLAUDE.md): a partida inteira dentro
de um único `eval` assíncrono, com esperas do tamanho das animações reais.

## Ciclo 12 — peso da estreia medido e cortado

Primeira medição real de carregamento (produção, https://betfood.vercel.app):
HTML 396ms, load 1,15s, FCP 1,2s, JS 88 KB, CSS 11 KB — e **219 KB de imagens**,
o maior item de longe. Com 4G simulado (1,6 Mbps, 150ms de latência) e cache
limpo, o shell abriu instantâneo (o service worker do ciclo 4 funciona), mas a
última foto só chegou em **1,56s**.

Causa: a estreia baixava 5 fotos — a de fundo do slide 1 e as 4 do mosaico do
slide 3, que muita gente nem vê (pula direto). Agora o mosaico só monta quando
o usuário sai do slide 1.

Medido depois, em produção: **1 imagem / 59 KB na estreia** (era 5 / 219 KB),
e as 4 restantes entram ao navegar. Verificado que o slide 3 continua completo.

## Ciclo 13 — auditoria de acessibilidade com axe-core (zero violações)

Rodei o axe-core 4.10 injetado na página, em produção, nas quatro telas
principais. Achados e correções:

- **Zoom bloqueado** (crítico): `user-scalable=no` no viewport impedia ampliar a
  página. Removido.
- **Vermelho da marca reprovava AA por um fio**: `#ea1d2c` dava 4,46 sobre
  branco (mínimo 4,5), tanto como texto quanto como fundo de botão. Trocado por
  `#e31b28` (4,72) — visualmente indistinguível. Token `--color-brand-500`.
- **Códigos usados ilegíveis no painel** (16 ocorrências): `opacity-40` derrubava
  o contraste pra 2,45. Agora o estado "usado" é dado por cor (`ink/65`) e pelo
  selo, não por transparência. Mesmo tratamento na carteira.
- **Hierarquia de títulos**: "Validar cupom" virou `h2` (havia `h1` → `h3`).
- **Texto alternativo redundante**: miniaturas das casas com `alt=""` onde o
  nome já aparece ao lado (leitor de tela anunciava duas vezes).
- **Rótulo "ativos"**: `brand-700/70` sobre `brand-50` dava 3,94 → cor cheia.

Resultado final: **`#/`, `#/parceiro` e página da casa sem nenhuma violação**;
carteira idem após o último ajuste.

**Erro de processo meu, registrado**: encadeei `npm run build; git commit; git
push` com `;` — o build falhou (comentário JSX inválido) e o commit subiu
mesmo assim, deixando produção quebrada por alguns minutos. Corrigido em
seguida. **Regra: `npm run build && git commit && git push`** (o `&&` para na
primeira falha).

## Ciclo 14 — "viagem no tempo": a lógica que só falha amanhã

Testei manipulando o estado pra simular dias passando. **Tudo passou**:

- Voltar depois de **3 dias fora** com 0 fichas: recarrega até o teto (50) e não
  além — o acúmulo é limitado, como projetado.
- **Bônus diário** volta a ficar disponível no dia seguinte.
- **Streak** continua quando se joga em dias seguidos (3 → 4) e **reinicia em 1**
  depois de dias sem jogar (7 → 1).
- **Cupom vencido**: some do contador de ativos, ganha carimbo "Expirado" na
  carteira, e o caixa recusa com data/hora exatas + a regra ("vale 24h depois de
  ganho").

Melhoria do ciclo: a carteira **separa válidos de histórico**. É a tela que o
cliente abre na frente do garçom — o cupom que vale agora fica na primeira
dobra, e usados/vencidos entram num "Ver usados e vencidos (N)" recolhido. Se
não houver nenhum válido, aparece uma mensagem curta com o caminho de volta.

Armadilha de teste (a terceira do mesmo tipo): trocar só o `#` da URL **não
recarrega o documento** — cheguei a acusar o service worker de servir versão
velha quando era a minha própria página nunca ter recarregado. Use
`page.reload()` de verdade antes de conferir qualquer deploy.

## Ciclo 15 — aba anônima e reset de apresentação

**Modo privado testado** (Safari anônimo faz `localStorage.setItem` lançar):
simulei a falha de gravação e joguei uma rodada completa em produção — Home,
carteira, painel e uma partida inteira com vitória, **zero erro**. O app degrada
como deveria: funciona normalmente, só não guarda progresso entre sessões.

**Novo: "Recomeçar do zero (apresentação)"** no rodapé do painel do parceiro.
Apaga todas as chaves `betfood-*` do aparelho e volta pra tela de boas-vindas —
serve pra mostrar a POC pra uma pessoa depois da outra sem abrir DevTools.
Confirmação inline (nunca `window.confirm`, que trava a página) e texto
explicando exatamente o que some. Verificado em produção. Registrado na skill
`demo-poc`.

## Ciclo 16 — celular deitado, cache envenenado e o checkpoint da Vercel

**Celular deitado (paisagem, 844x390)**: o botão "Girar agora" ficava em y=1834
numa tela de 390px — completamente fora, e o jogo é uma tela de uma ação só.
A roda agora encolhe em telas baixas (`[@media(max-height:560px)]`) e o herói da
Home é escalado (as luzes são posicionadas em pixels, então encolher a caixa
desalinharia — `scale` mantém a proporção). Botão passou a caber.

**Bug meu, de infraestrutura, com potencial de 1 ano**: o `vercel.json` (ciclo 2)
marcava `/assets/(.*)` como `immutable, max-age=31536000`. A regra casa pelo
caminho e vale também pra **404** — quem pedisse um asset durante a propagação
de um deploy guardaria o erro por um ano e veria o app **sem estilo nenhum**.
Aconteceu comigo: CSS baixava 200 por `fetch`, mas o `<link>` batia num 404
cacheado. Removi a regra (a Vercel já dá cache longo a arquivo com hash) e
acrescentei rede de segurança no `index.html`: se o `body` não pintar, o app
recarrega a folha com parâmetro novo, uma vez por sessão.

**Consequência do meu método**: dezenas de `curl` em laço + recargas headless
acionaram a proteção antibot da Vercel — o site passou a responder
403 "Security Checkpoint". Regra nova no CLAUDE.md: validar no preview local e
tocar a produção uma vez por ciclo, sem polling.

## Ciclo 17 — conteúdo pra quem joga várias rodadas

Pensando em quem vai jogar seguidas vezes hoje:

- **Quiz dobrou: 12 → 24 perguntas.** Sorteia 3 por partida, então a repetição
  só começa lá pela 8ª partida (era a 4ª). Todas verificáveis, sobre cozinha
  potiguar/nordestina (paçoca de carne seca, caju e a castanha, pirão, bolo de
  rolo, sarapatel, beiju, leite de coco…). Regra do banco mantida: **a resposta
  certa é sempre a primeira do array `options`** — o embaralhamento é feito na
  tela. Verificado jogando uma partida completa: 3/3.
- **Etiquetas da memória conferidas contra a foto real** (duas estavam
  imprecisas): "Frango" virou "Churrasco" (a foto é uma tábua mista) e "Prato
  feito" virou "Petiscos" (a foto são vários pratos pequenos). Detalhe que
  aparece na tela e passa desleixo se ficar errado.

Validação feita no **preview local** (`npx vite preview --port 5188`), sem
martelar a produção — regra do ciclo 16.

## Ciclo 18 — o laço emocional deixa de soar automático

Quem joga várias rodadas via sempre as mesmas palavras: "Deu prêmio!" ou
"Não foi dessa vez / A sorte muda rápido por aqui". Na terceira repetição o app
soa robótico — o oposto do que o José pediu desde o começo.

- **Frases de resultado sorteadas por rodada**: 4 manchetes de vitória, 3 de
  derrota e 4 consolos. Sorteadas na montagem (não a cada re-render, senão o
  texto trocaria sozinho na tela). A derrota nunca cobra nem provoca — continua
  leve, com o lembrete de que a ficha volta sozinha. Verificado em 4 rodadas
  seguidas: "Ganhou agora", "Passou perto", "Deu prêmio!", "É seu!".
- **Quarto prêmio por casa**: cada restaurante ganhou um segundo prêmio pequeno
  (suco natural, café coado, farofa especial, refrigerante 1L). Os pesos por
  faixa continuam iguais — grande 5, médio 15, pequenos 40 somados, nada 40 —,
  então a chance de ganhar não mudou, só a variedade do que sai.

## Ciclo 19 — o painel diz a verdade (conferido) e agora explica o número

**Auditoria dos 4 contadores com ações reais**, cada delta verificado:
gerar 3 códigos 12 → 15; usar 1 código no restaurante 8 → 9; ganhar um cupom
jogando 4 → 5; validar esse cupom no caixa 2 → 3. Nenhum número inflado ou
defasado — importa porque é o que o José mostra pro dono do restaurante.

**Melhoria**: abaixo das métricas, uma linha traduz os números crus pra
linguagem de dono — "60% dos códigos entregues viraram jogada · 3 de 5 cupons
ganhos voltaram pra casa". Calculada dos mesmos dados (nada inventado) e só
aparece quando há base, pra não exibir "0% de 0".

## Ciclo 20 — uma unidade só: ficha

Inconsistência herdada da migração pra fichas: o HUD mostrava **190 fichas** e a
página da casa, logo abaixo, mostrava **19 jogadas** — duas unidades pro mesmo
saldo, na mesma tela. Quem chega novo não sabe qual é a moeda.

Agora o número grande da casa é o mesmo do topo (fichas) e a conversão virou
legenda: "Dá pra 19 jogadas · 10 fichas cada". Sem saldo, o texto explica o
custo e aponta o código da mesa. Regra registrada no CLAUDE.md pra não voltar.

## Ciclo 21 — a explicação estava desatualizada em relação ao app

A tela "Como funciona" foi escrita no ciclo 3; a recarga automática de fichas
chegou no ciclo 6 e **nunca entrou na explicação**. Quem zerava via um relógio
contando no topo da tela sem nada dizer o que era aquilo.

Novo item (com ícone próprio de seta circular — o relógio já é da validade do
cupom): "As fichas voltam sozinhas · A cada 10 minutos entram mais 10 fichas,
até 50. Ninguém fica sem jogar." Verificado abrindo o painel pelo HUD.

Lição pro CLAUDE.md já registrada em espírito: mecânica nova exige revisar a
tela que explica o app, senão a explicação vira mentira por omissão.

## Backlog priorizado (pedido do José, 26/ago à noite)

1. **Subir o nível dos games além da roleta** — "memória e demais tão muito low
   level". A roleta é a régua (luzes, som, glow, resultado teatral). Elevar:
   - Memória: cartas com arte/foto de pratos em vez de texto puro, animação de
     par mais gorda, celebração em camadas, fundo menos cru.
   - Raspadinha: textura/brilho premium na camada, partículas ao raspar,
     revelação mais teatral.
   - Quiz: visual game-show (palco, pontos voando, tensão no timer).
   Usar skill frontend-design + sons existentes; contrato GameProps intocado.
2. ~~Nome do nível trunca no HUD em telas estreitas~~ FEITO no ciclo 1 — folga
   de largura no header (gap/tracking/padding); "Nv.1 Bronze" cabe inteiro a 390px.
3. ~~Vercel: conectar~~ FEITO — betfood.vercel.app com auto-deploy.

## Bloqueios / atenção

- Disco C: viveu 0 bytes hoje; ~7 GB livres após limpezas. Faxina pendente.
- Wiki jibcl-wiki não conhece este projeto (nasceu hoje).
