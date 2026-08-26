# STATUS — BetFood POC

Atualizado: 2026-08-26 (noite — fim do ciclo 1 do loop de melhoria)

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

1. Workflow "betfood-epico-ifood": verificador final (build + teste de browser + commit) — conferir se commitou.
2. **Passe dopaminérgico final** (aguardando o commit do verificador pra não conflitar): HUD no Layout (fichas com count-up + tick, bônus diário pulsando, streak, nível), Home games-first (roleta-herói girando com luzes + shimmer, thumbnails ricas dos jogos, restaurantes abaixo), near-miss na roleta, XP flutuante no resultado.
3. Build + push + **deploy preview na Vercel** (José já autorizou preview? — ele pediu o plano; o "sobe" final é dele). Team: jose-icaro-bezerra-clementes-projects.

## No ar

**https://betfood.vercel.app** (deploy automático a cada push em main).
Games repaginados, modo imersivo, HUD de fichas/XP/streak, near-miss na roleta —
tudo publicado e verificado sem erro de console.

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
