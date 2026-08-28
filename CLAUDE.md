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

- **Contraste**: corpo e rótulos em `ink/70` (mede 5,97 no papel). `ink/65` passa
  raspando; abaixo disso reprova. **`brand-500` é preenchimento, não texto**: sobre
  o papel (#faf9f9) dá 4,49 e reprova — texto vermelho usa `brand-600` (5,26).
  `accent2` (#f5a623) **nunca** como texto sobre claro — use `#8a5a00`.
  Atenção: contraste medido sobre BRANCO engana; o fundo do app é papel, mais
  escuro (descoberto no ciclo 37).
- **Toque**: todo alvo interativo com ≥44x44px de área (padding conta).
- **Gesto sempre tem alternativa**: se um jogo exige arrastar, raspar ou
  segurar, ofereça um botão que faça o mesmo (ver "Revelar sem raspar" na
  raspadinha, ciclo 40). O resultado já vem do `drawPrize()` — o gesto é
  apresentação, então a alternativa não desequilibra nada.
- **Safe-area**: topo com `pt-[env(safe-area-inset-top)]` (PWA no iPhone desenha
  sob o notch), rodapé com `pb-[env(safe-area-inset-bottom)]`.
- **Som**: nunca forçar `navigator.audioSession` — o app respeita o silencioso do
  aparelho, e o mudo do app fica no HUD e na barra do jogo.
- **Fotos**: sempre via `src/components/FoodPhoto.tsx` (trata erro e não deixa
  skeleton infinito); miniaturas com o helper `thumb(url, w)`.
- **Sem beco sem saída**: toda tela terminal precisa de pelo menos uma saída
  clara; o shell (HUD + tab bar) só some durante a partida — ver
  `ImmersiveContext` documentado em `src/components/Layout.tsx`.
- **Condição do prêmio se declara ANTES da ficha sair**: se o jogo pode
  terminar sem sortear (quiz precisa de 2 de 3, memória precisa fechar no
  limite), diga isso na tela inicial do jogo — nunca só no resultado (ciclo 42).
- **Urgência só quando é real**: contagem regressiva, cor de alerta e "vence em"
  só aparecem apoiados num prazo verdadeiro já declarado ao jogador. Nunca
  inventar pressa pra forçar visita.
- **Copy honesta**: não prometer prêmio garantido (40% do peso é "não foi dessa
  vez"); casas fictícias levam selo "Casa exemplo".

## Cartão de mesa e QR (a ponte física)

`src/components/QrCode.tsx` gera QR em **SVG no aparelho** (`qrcode-generator`,
nível M) — nunca canvas nem API externa: o alvo é papel, e a casa pode estar sem
internet na hora de imprimir. `src/components/CartoesDeMesa.tsx` monta a folha
recortável (um cartão por código **não usado**, com QR + código + fichas
derivadas de `credits × CHIP_COST`) num **portal em `document.body`**; o
`@media print` em `src/index.css` esconde `#root` inteiro, então a folha não
herda barra, HUD nem fundo colorido. Botões do cabeçalho levam `.nao-imprime`.
Tudo isso mora no chunk lazy do Partner — o jogador não baixa nada disso.

**O QR carrega o código** (`?c=CODIGO`): `RestaurantPage` resgata sozinho ao
chegar e **limpa o parâmetro da URL** — sem isso, recarregar repetiria a
tentativa e prenderia o aviso na tela. O código também vai impresso embaixo do
QR e o campo manual continua vivo: leitor de QR falha em mesa mal iluminada.
Cuidado ligado a isso: qualquer link de entrada com query precisa que
`src/App.tsx` guarde `pathname + search` antes de desviar pro onboarding —
guardar só o pathname faz o novato chegar na casa certa sem ficha.

## O painel do parceiro é trancado (PIN)

A aba "Parceiro" gera código de mesa e dá baixa em cupom — nas mãos do cliente
é ficha infinita e cupom queimado. `src/pages/Partner.tsx` exporta um porteiro
que mostra `src/components/TravaParceiro.tsx` até o PIN certo; o painel de
verdade é `PainelParceiro`. **PIN de fábrica `1234`** (`PIN_PADRAO`), trocável
no rodapé do painel. As chaves (`betfood-parceiro-pin`, `betfood-parceiro-ok`)
moram **fora do `DB`**: "Recomeçar do zero" limpa a operação, não o acesso.

Duas coisas a não esquecer: a trava **tem que ser componente separado** (o
painel tem dezenas de hooks; early return lá dentro é hook condicional), e ela
**não é segurança** — o dado é local, sem servidor. É trava de balcão.

## Economia e progressão (store.ts)

- **Fichas** (moeda global): boas-vindas 50, jogada custa `CHIP_COST` 10, bônus diário +30 (`claimDailyBonus`), código da mesa credita `credits × 10` fichas. Recarrega sozinha: `REGEN_AMOUNT` 10 a cada `REGEN_INTERVAL_MS` 10min até `REGEN_CAP` 50.
  **A unidade visível é sempre FICHA.** Não mostre "N jogadas" como número
  principal em lugar nenhum — o HUD mostra fichas e uma segunda unidade na mesma
  tela confunde (corrigido no ciclo 20). Se precisar falar de jogadas, use como
  legenda: "dá pra N jogadas · 10 fichas cada".
- **XP/nível**: +10 por jogada, +25 por vitória; níveis Garfo de Bronze → Prata
  → Ouro → Chef da Casa → Lenda de Natal (`getProgress()`). **Cada nível paga
  fichas** (campo `bonus` em `LEVELS`: 30/50/80/120), e o valor é declarado no
  sheet "Como funciona" antes de ser conquistado. O pagamento acontece dentro de
  `takeLevelUp()`, na MESMA escrita que grava `seenLevel` — a tela nunca paga.
  Tirar essa linha faz o bônus ser pago a cada consulta do toast, de 900 em 900
  ms (aconteceu no ciclo 59). Ao mexer nessa função, **meça o saldo ao longo do
  tempo**, não só o texto do toast.
- **Streak**: dias seguidos jogando (qualquer casa). **Faz o bônus diário
  crescer**: +30 no 1º dia, +`STREAK_STEP_CHIPS` (10) por dia seguido, teto no
  `STREAK_MAX_DAYS` (5º) — declarado no sheet "Como funciona". Nunca leia
  `db.streak` direto: `streakVivo()` zera a sequência se a última jogada não foi
  hoje nem ontem, senão a tela mostra sequência morta e paga bônus por dias que
  a pessoa não jogou. O valor exibido sai sempre de `dailyBonusAmount()`.
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

## Como testar (o dev server não sobrevive em segundo plano)

`npm run dev` iniciado em background nesta máquina é encerrado de fora depois de
alguns minutos (verificado 27/ago: o Vite sobe, serve, e leva `[killed]`). Não
conte com ele entre um ciclo e outro. Alternativas, em ordem:

1. **Testar em produção** — `https://betfood.vercel.app` está sempre atualizado
   (todo push vira deploy) e é o que o usuário final vê, inclusive service
   worker, que só roda em produção.
2. **Preview local pontual** — `npm run build` e `npx vite preview --port 5188`
   dentro do mesmo comando que faz o teste.
3. O José pode subir o dev server no terminal dele quando for mexer na mão.

Armadilhas do playwright-cli: não navega de `https://betfood.vercel.app` para
`http://localhost` (ERR_ABORTED) — feche a sessão (`playwright-cli close`) e
abra direto no destino. Prefira `getByRole('button', { name: ... })` a refs de
snapshot, que expiram a cada re-render.

### Não martele a produção com verificação automática

A Vercel tem proteção antibot. Depois de dezenas de `curl` em laço + recargas de
navegador headless em poucas horas, `betfood.vercel.app` passou a responder
**403 "Vercel Security Checkpoint"** (ciclo 16) — inclusive pra navegador. Quem
recebe o link nesse momento pode topar com a barreira.

Regra: **verifique o build no preview local** (`npm run build && npx vite
preview --port 5188`) e vá à produção **uma vez**, no fim do ciclo, sem laço de
polling. Se precisar esperar o deploy, espere por tempo (uma pausa única), não
por repetição. Se o checkpoint aparecer: pare de acessar por alguns minutos; ele
cede sozinho. Se persistir, o José pode desligar em Vercel → Project →
Firewall → Attack Challenge Mode.

### Testar JOGO exige um único `eval` assíncrono (não vários comandos)

Cada chamada de CLI custa segundos. Os jogos têm relógio próprio (quiz: 15s por
pergunta; memória: desvira em 800ms; contagem do placar final: 380ms por ponto),
então medir entre comandos lê estado **de outra fase** e produz alarme falso —
já aconteceu duas vezes: um "quiz não conta acertos" que era timeout entre meus
comandos, e um "placar zerado" que era a contagem animada ainda não ter rodado.

Faça a partida inteira dentro de um `playwright-cli eval "async () => {...}"`:
clique, `await sleep(...)` do tamanho da animação real e só então leia o DOM.
**Detectar derrota num teste**: compare `totalWins` antes e depois. Não procure
a manchete no texto — são três frases sorteadas (`MANCHETES_DERROTA`), e olhar
só uma produz "dez rodadas sem derrota" num jogo que perde 40% das vezes.

Respostas certas do quiz: em `QUESTION_BANK` a correta é sempre a **primeira**
do array `options` (as alternativas são embaralhadas na tela, o texto não muda).
Antes de "consertar" um jogo, reproduza o defeito com esse método.

## Comandos

**Sempre `&&`, nunca `;`** entre build e commit:
`npm run build && git add -A && git commit -m "..." && git push`. Com `;` o
commit sobe mesmo se o build falhar — já aconteceu (ciclo 13) e produção ficou
quebrada por minutos, porque o deploy é automático a cada push.

**Auditar acessibilidade**: injete o axe-core na página e rode nas rotas
principais (exemplo completo no STATUS, ciclo 13).

**Depois de rebuildar, force `location.reload()`.** `playwright-cli goto` para
uma URL que só difere no **hash** NÃO recarrega o documento: você continua
medindo o código de antes e vai "consertar" o que já estava certo (aconteceu no
ciclo 57, onde culpei o service worker por engano). Antes de confiar em
qualquer medição, confira o bundle que está rodando —
`[...document.querySelectorAll('script[src]')].map(s => s.src)` — contra o
`dist/index.html`.

**Telas fora do `Layout` não herdam nada**: `/welcome` tem que trazer o próprio
`<main>` e o próprio `<h1>` — o `h1` do splash some em 2,1s e não conta. Área
com `overflow-x-auto` precisa de `tabIndex={0}` + nome acessível, senão o
teclado não alcança. Overlay que cobre o app é modal: `aria-modal`, foco pra
dentro e Escape fechando.


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

## Versão velha rodando: o app avisa sozinho

`vite.config.ts` gera um `BUILD_ID` por build, escreve no `index.html` como
`<meta name="betfood-build">` e emite `version.json`. **O id nunca entra no
bundle**: dentro do JS ele mudaria o hash do arquivo a cada build e a
conferência de deploy (comparar `assets/index-XXXX.js` local com o de produção)
pararia de funcionar para sempre. `src/components/AvisoDeVersao.tsx` compara os dois na montagem e
a cada volta pro app (máx. 1x/min) — diferente significa que ESTE documento está
velho, e aparece uma pílula "Versão nova · toque pra atualizar". **Convite, não
recarga automática**: ninguém perde jogada no meio.

Não troque isso pelo evento de atualização do service worker: `sw.js` é idêntico
entre builds (nunca dispara) e, quando dispara, o usuário já está na versão nova.

## Vocabulário fixo (uma coisa, um nome)

- **ficha** — a moeda. Único número de saldo mostrado ao jogador.
- **jogada** — uma partida inteira; é o que custa `CHIP_COST` fichas.
- **tentativa** — movimento DENTRO de um jogo (par de cartas na memória).
  Nunca chame isso de "jogada": o HUD mostra fichas na mesma tela e "20 jogadas
  restantes" parecia saldo de 200 fichas (corrigido no ciclo 28).
- **casa** — o restaurante, na voz do app. "restaurante" só em texto formal.
- **cupom** — o prêmio ganho, com código. **prêmio** é o que está na tabela.

## Número que o app afirma é derivado, nunca digitado

Qualquer número exibido — custo da jogada, fichas de boas-vindas, bônus, teto e
intervalo da recarga, chance de não premiar — sai da fonte (`store.ts` ou a
tabela de prêmios do restaurante), nunca escrito no texto. Motivo: a regra muda
e o texto fica, virando afirmação falsa — inclusive no painel do parceiro, onde
o app faz afirmações **ao dono do restaurante sobre o custo dele** (ciclos 25 e
26). Ao escrever copy com número, importe a constante e interpole.

## vercel.json: só chaves do esquema (nada de comentário)

O arquivo é **validado pela Vercel** — qualquer propriedade fora do esquema
(inclusive uma chave `"comment"` explicativa) faz o deploy **falhar antes do
build**, sem erro de compilação nenhum. Aconteceu no ciclo 16 e derrubou 18
horas de deploys em silêncio: o build local passava, o push ia pro GitHub, e a
produção continuava servindo a versão velha (ciclo 46-47).

Anotações sobre cache moram aqui, não lá:
- `/assets/*` **não** leva regra própria. Já tem hash no nome e a Vercel dá cache
  longo por padrão; declarar `immutable` faria a regra valer também pra respostas
  404 durante a propagação de um deploy, e o cliente guardaria o erro por um ano.
- `/sounds/*` e `/icons/*` não têm hash: cache moderado (7 dias).

**Depois de qualquer push, confirme que o deploy saiu** — comparar o bundle
servido com o `dist/index.html` local (comando na seção de deploy) leva 5s e
evita horas verificando uma versão que não está no ar.

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
