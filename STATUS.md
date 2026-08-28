# STATUS — BetFood POC

Atualizado: 2026-08-27 (ciclo 53 do loop de melhoria contínua)

## Onde está

**No ar e atualizado: https://betfood.vercel.app**
(Os deploys ficaram 18h quebrados por um `vercel.json` inválido — resolvido no
ciclo 47. Depois de todo push, confirme que o bundle servido bate com o local.)
Todo push em `main` vira deploy automático (GitHub `wpraiz/betfood`, público).

O app está completo e verificado ponta a ponta em produção: onboarding, Home
games-first, os quatro jogos (roleta, raspadinha, quiz, memória) com som e
animação, economia de fichas com recarga automática, XP/níveis/sequência,
carteira de cupons com validade, e painel do parceiro que **valida o cupom no
caixa** — o momento que fecha o argumento com o dono do restaurante.

Instala no iPhone pela tela de início (é PWA), funciona offline depois da
primeira visita, respeita o silencioso do aparelho e passa em auditoria de
acessibilidade (axe-core, zero violações nas telas principais).

## Próxima ação (o que realmente falta)

1. **Teste em iPhone real** — o único item que não dá pra fazer daqui. Safe-area
   (notch), dica de instalação, compartilhamento nativo e som no iOS só existem
   no aparelho. É o próximo passo do José.
2. **Decisão comercial com o Allan** — valor e formato da sociedade. Resumo da
   conversa e dos números discutidos está no histórico da sessão; a régua é:
   participação em **receita ou societária, nunca "do lucro"**, e a fase
   seguinte (servidor, contas, cadastro real) orçada à parte.
3. **Ciclos de melhoria** seguem: escolher o de maior impacto, validar no preview
   local, publicar e registrar aqui.

## Como trabalhar neste repo

- `CLAUDE.md` é a fonte: direção visual, regras de UI (contraste, toque,
  safe-area, unidade "ficha"), contrato dos mini-games, deploy e — importante —
  **as armadilhas de teste já descobertas** (dev server que não sobrevive em
  background, `&&` entre build e push, partida inteira num único `eval`, não
  martelar a produção com polling).
- Skills em `.claude/skills`: `demo-poc` (roteiro da apresentação), `new-game`,
  `release-apk`, mais as de design (`frontend-design`, `ui-ux-pro-max`,
  `web-design-guidelines`, `react-best-practices`).

## Bloqueios / atenção

- Repositório está **público** (foi preciso pro GitHub Pages, que depois virou
  plano B abandonado). A Vercel funciona com repo privado — dá pra reverter.
- Disco C: chegou a 0 bytes em 26/ago; ~35 GB livres depois das limpezas.
- A wiki `jibcl-wiki` não conhece este projeto (nasceu em 26/ago).

---

# Histórico dos ciclos

## Ciclo 53 — o relógio do cupom passa a aparecer quando importa

O ciclo 52 pôs o lembrete do cupom na Home, mas tratava igual um cupom que
vence amanhã e um que vence em duas horas. O segundo é o único que exige
sair de casa agora.

Feito em `src/pages/Home.tsx`:

- **Menos de 3h pra vencer muda o cartão**: título vira contagem regressiva
  ("Seu prêmio vence em 2h 10min"), borda e fundo passam de âmbar pro vermelho
  da marca. Acima de 3h o cartão continua exatamente como estava.
- **A contagem é em horas + minutos** abaixo de 3h e só minutos na última hora
  — "45min" lê melhor que "0h 45min".
- **A urgência é real**: o prazo é o `expiresAt` do cupom, avisado no momento
  em que ele foi ganho (ciclo 51). Nada de contador inventado pra pressionar.

Conferido no preview com cupom injetado a 2h10 do vencimento: cartão vermelho,
texto correto, casa certa. Texto quase preto sobre rosa claro — contraste ok.

## Ciclo 52 — o prêmio que espera some da vista

O motivo de a pessoa ir ao restaurante — um cupom válido na mão — ficava
escondido na aba da carteira. Quem abria o app via a roleta e os jogos, e nada
lembrava que havia prêmio pra usar antes de vencer.

Agora, logo abaixo do herói e só quando existe cupom válido: **"Você tem um
prêmio pra usar · Tapiocaria Sol Potiguar · vale até amanhã às 21:06"**, tocável,
levando à carteira. Mostra a casa e o prazo do cupom **mais próximo do
vencimento**, que é o que precisa de ação primeiro; com mais de um, o título
conta quantos.

Verificado nos dois estados: sem cupom o bloco não existe; depois de ganhar,
aparece com casa e prazo corretos. É a mudança com efeito mais direto no negócio
até aqui — leva gente ao salão do parceiro.

## Ciclo 51 — o prazo aparece no instante em que ele começa a correr

Medição primeiro (20 ciclos desde a última): produção em **1,05s de load, 91 kB
de JS, 59 kB de imagem** — sem regressão; o lazy-load por jogo e o mosaico
adiado seguem segurando o peso.

Melhoria: a tela de vitória entregava o código e dizia "Mostra pro garçom e
pronto", mas **não dizia até quando** — sendo que é exatamente ali que o relógio
de 24h começa. A validade só aparecia depois, na carteira.

Agora: "Mostra pro garçom e pronto — **vale até amanhã às 20:37**", com o prazo
em linguagem de gente (hoje/amanhã/data + hora). Junto com o endereço logo
abaixo, a tela de vitória passou a responder as três perguntas do momento: o que
ganhei, até quando vale e onde uso.

## Ciclo 50 — o cupom na carteira agora leva até a casa

Fecha o que o ciclo 49 abriu. O cartão do cupom mostrava o nome da casa como
**texto morto** e a data do ganho — nada que ajudasse a chegar lá, sendo que o
cupom só vale naquele endereço e por 24h.

Agora o topo do cartão é um link: foto, nome e **o endereço** da casa, com seta.
Um toque abre a página dela, onde ficam o mapa e as chances. A data do ganho saiu
do lugar de destaque (ela já aparecia na validade, que é a informação que
importa).

Verificado: joguei até ganhar, o cartão mostrou "Potengi Camaroeira · Av. Erivan
França, 1240" e o toque abriu a casa certa.

## Ciclo 49 — o cupom só vale numa casa, e o app não dizia onde ela fica

Buraco de produto que passou 48 ciclos despercebido: o app repete que o cupom
vale **24h e só na casa que emitiu** — e nunca informava o endereço. Quem joga
de casa (premissa do produto desde o primeiro dia) ganhava um prêmio sem saber
pra onde ir.

Agora cada casa tem endereço no cadastro, e ele aparece em dois lugares:
- **Página da casa**: cartão com pino, endereço e bairro — toque abre o mapa do
  aparelho já com o nome da casa na busca.
- **Tela de vitória**: logo abaixo de "Mostra pro garçom e pronto", o link
  "endereço · como chegar" — o momento exato em que a informação vale mais.

Endereços são ruas reais de Natal com números fictícios, coerentes com as casas
serem marcadas como "Casa exemplo".

## Ciclo 48 — conferência em produção do que ficou 18h engavetado

Durante a janela dos deploys quebrados eu validei tudo no preview local — o que
é legítimo, mas não é o que o usuário abre. Com a produção restabelecida,
refiz a conferência **no site publicado**, e as oito entregas estão lá:

- Chances de cada prêmio visíveis pro jogador (com os 40% de "não foi dessa vez")
- Campo do código com teclado ajustado (`autocapitalize=characters`, Enter = ir)
- "Revelar sem raspar" na raspadinha
- Histórico do jogador na carteira
- Código do cupom ampliável em tela cheia
- Tabela de prêmios no painel, com o prêmio editável
- Link direto da casa
- Timer do quiz proporcional (marcou 21s numa pergunta longa; era 15s fixo)

Console sem erro. É a primeira vez desde o ciclo 33 que o que está no ar
corresponde ao que está no repositório.

## Ciclo 47 — causa encontrada: um comentário no vercel.json

O que derrubou 18 horas de deploys foi uma chave `"comment"` que **eu** coloquei
no `vercel.json` no ciclo 16, pra explicar por que não havia regra de cache em
`/assets`. A Vercel **valida esse arquivo contra um esquema** e rejeita
propriedade desconhecida — o deploy falha antes do build, sem erro de
compilação, e o push segue parecendo normal.

Como fechei o diagnóstico: os horários bateram. O último deploy bem-sucedido
(06:08 UTC = 03:08 local) é o commit imediatamente **anterior** à edição do
`vercel.json` (03:12 local). Antes disso eu já tinha descartado erro de código
(clone limpo + `npm ci` + build passou) e erro de caixa em imports (varredura).

Corrigido: `vercel.json` só com chaves do esquema; a explicação foi pro
CLAUDE.md, junto com a regra nova — **depois de todo push, confirmar que o
deploy saiu**, comparando o bundle servido com o local. São 5 segundos que
evitam horas verificando uma versão que não está no ar.

A hipótese do ciclo 46 (limite diário por causa do projeto duplicado) estava
errada; o `betfood-poc` duplica deploys mas não era a causa.

## Ciclo 46 — DESCOBERTA GRAVE: produção 15h atrasada, deploys falhando

Verificação de rotina revelou que **o site publicado está 15 horas atrasado**: o
bundle servido é o do ciclo ~33. Tudo desde então (código em tela cheia, teclado
do cliente, acessibilidade dos jogos, tempo adaptativo do quiz, "Revelar sem
raspar", tabela de chances pro jogador, histórico do jogador) **não está no ar**.

Diagnóstico:
- Código está bom: clonei o repo do zero, `npm ci` + `npm run build` passou limpo.
  Não é erro de compilação, nem de caixa em import (varri todos).
- GitHub mostra os deploys chegando: **os 8 últimos falharam**, todos.
- Causa provável: **cada push dispara DOIS deploys** — os projetos `betfood` e
  `betfood-poc` estão ambos ligados ao repo (o `-poc` fui eu que criei num ciclo
  anterior). Com ~50 pushes no dia, isso consome ~100 deploys e bate no limite
  diário do plano Hobby.
- Não consigo confirmar pelo MCP (403/401 nesse projeto) nem pausar o duplicado
  (ação bloqueada pelo classificador de permissões).

Mudança de método imediata: **parar de publicar a cada ciclo**. Acumular as
mudanças e publicar em lote, pra não queimar cota nem esconder falha.

## Ciclo 45 — o jogador passa a ver o próprio histórico

Complemento do ciclo 44: mostrar a chance antes de jogar é metade; a outra
metade é mostrar **como foi de fato**. O app contava XP e nível (só os momentos
bons) e nunca dizia quantas partidas a pessoa jogou nem quantas renderam prêmio.

Agora o store conta `totalPlays`/`totalWins` (na cobrança da ficha e na entrega
do cupom) e a carteira mostra, abaixo dos cupons: **"Você jogou 3 vezes e ganhou
2 prêmios"** — com a porcentagem a partir da 5ª partida, quando o número começa
a significar alguma coisa. Verificado: joguei 3 rodadas e o texto bateu com o
estado (`plays=3 wins=2`).

Só aparece depois da primeira partida, e quem já jogava antes começa a contagem
do zero (o dado não existia).

## Ciclo 44 — o jogador agora vê a mesma chance que o dono vê

O painel do parceiro mostrava a tabela com a probabilidade de cada prêmio desde
o ciclo 31. O jogador não via nada — e esconder a chance de quem joga é
exatamente a lógica de cassino que este produto diz não ser.

Agora a página da casa tem **"Prêmios desta casa · Veja a chance real de cada
um"** (recolhido por padrão, um toque abre): mesma lista, mesmos percentuais
calculados dos pesos, inclusive a linha "Não foi dessa vez · 40%" — sem
maquiagem. Se o dono editar a tabela, cliente e painel mudam juntos.

É o argumento mais forte que o app tem contra a comparação com aposta: não é só
dizer "não é aposta", é **mostrar a matemática antes de a pessoa jogar**.

## Ciclo 43 — as chamadas dos jogos prometiam o que o sorteio não garante

Continuação do ciclo 42, agora na vitrine. As chamadas na Home diziam **"Gire e
ganhe na hora"** e **"Raspe e descubra seu prêmio"** — as duas prometem prêmio,
sendo que 40% do sorteio é "não foi dessa vez". É a mesma promessa exagerada que
o herói da Home já tinha corrigido no ciclo 5, sobrevivendo nos cards.

Agora anunciam o gesto e a condição, não o resultado:
- Roleta: **"Uma volta, uma chance"**
- Raspadinha: **"Raspe e descubra na hora"**
- Quiz: **"2 de 3 libera o prêmio"** (era "Acerte e leve o prêmio")
- Memória: **"Feche os pares no limite"** (era "Encontre os pares do cardápio")

De quebra, os dois jogos com condição agora anunciam a regra já na vitrine — o
jogador escolhe sabendo o que cada um cobra dele.

## Ciclo 42 — a memória cobrava a ficha sem contar a regra

Nem toda partida chega a sortear prêmio: o quiz exige 2 acertos de 3 e a memória
exige fechar os pares dentro do limite. O quiz avisa antes ("3 perguntas. 2
acertos. Prêmio na mesa." e "2 de 3 libera o prêmio"); **a memória não dizia
nada** — o jogador só descobria o limite olhando as pills do placar, e só
entendia a consequência ao perder, com a ficha já gasta.

Agora, acima do tabuleiro: "Feche os 8 pares em até 20 tentativas pra concorrer
ao prêmio." Números derivados (`FOODS.length`, `MAX_MOVES`), como manda a regra
do projeto — se o limite mudar, o texto acompanha.

Regra que fica: **condição pra concorrer ao prêmio se declara antes da ficha
sair**, nunca no fim.

## Ciclo 41 — o quiz dava 15 segundos pra qualquer pergunta

As perguntas variam de **14 a 39 palavras** (contando as alternativas), e todas
tinham os mesmos 15 segundos. Quem lê mais devagar — por baixa visão, dislexia,
idade ou só por não ter o português como primeira língua — perdia a ficha sem
chance de responder, e as perguntas longas eram injustas até pra leitor rápido.

Agora o tempo é proporcional ao texto: 9s de base + 0,35s por palavra. Medido no
app: **21s numa pergunta de 35 palavras, 18s numa de 26, 17s numa de 21**. A
tensão continua (a barra e o tique-taque dos últimos 5 segundos seguem iguais),
mas o relógio passou a medir leitura em vez de sorte.

Mesma família do ciclo 40: o jogo não pode excluir quem tem outro ritmo.

## Ciclo 40 — a raspadinha era injogável pra quem tem limitação motora

O jogo exigia arrastar o dedo por **55% da área** pra revelar. Quem tem
dificuldade motora (tremor, força reduzida, uso de uma mão só) simplesmente não
conseguia terminar uma rodada — e pagou a ficha do mesmo jeito.

Agora existe **"Revelar sem raspar"** abaixo da barra de progresso. Revela o
mesmo resultado já sorteado: ninguém ganha nem perde chance por usar o botão,
porque o prêmio foi decidido no `drawPrize()` da montagem, não pela raspagem.

Verificado nos dois caminhos: pelo botão (fichas 300 → 290, cupom entregue) e
raspando de verdade (mesma cobrança, mesmo fluxo). O botão também cobra a ficha
se a rodada ainda não tinha começado, então não vira atalho de graça.

## Ciclo 39 — a preferência de menos movimento virou fonte única

Continuação do ciclo 38, agora nos outros jogos. Criado `src/lib/motion.ts` com
`reduzMovimento()` — um lugar só pra consultar a preferência do sistema, com a
regra escrita no arquivo: **encurtar espera decorativa, nunca tempo de leitura**
(ver o prêmio leva o mesmo tempo pra todo mundo).

- **Quiz**: a contagem animada do placar (380ms por ponto) some — o número
  aparece pronto. Verificado com a preferência ligada: o "3/3" já estava na tela
  no instante do fim, em vez de subir devagar sem animação nenhuma.
- **Memória**: a folga extra da vitória sem erros (1900ms em vez de 1500ms)
  existia pra caber a última chuva de confetti; sem animação, vira espera vazia.
- **Roleta**: passou a usar o helper em vez da checagem local do ciclo 38.

## Ciclo 38 — quem pede menos movimento esperava 4s olhando uma roda parada

Primeiro, verifiquei se a descoberta do ciclo 37 (vermelho vivo reprova como
texto no fundo papel) valia pro resto do app: **não** — os outros usos de
`brand-500` são texto grande (limite 3:1) ou ícone, e passam. Correção do ciclo
anterior estava no lugar certo.

Aí testei algo nunca verificado: o app com `prefers-reduced-motion: reduce`
ligado. O CSS zera as animações, então a roleta **não gira** — mas o código
continuava esperando os 4,2s do giro. Resultado: 4,4 segundos encarando uma roda
imóvel, sem retorno nenhum, justamente pra quem pediu menos movimento.

Agora a roleta lê a preferência e encolhe os tempos (giro 700ms, resultado
600ms). Medido: **4,5s no modo normal** (o teatro continua inteiro) e **0,8s com
movimento reduzido**. Mesmo resultado, sem a espera vazia.

## Ciclo 37 — os jogos nunca tinham sido auditados

Seguindo a lição do ciclo 36 (auditar além do estado inicial): rodei o axe nas
**quatro telas de jogo**, que nunca tinham passado por auditoria nenhuma. Achou
duas classes de problema:

1. **`brand-500` como texto reprova sobre o papel.** Meu vermelho passa sobre
   branco (4,72) mas o fundo do app é `#faf9f9`, e ali dá **4,49** — reprova por
   um fio. Corrigi para `brand-600` (5,26) em todo texto vermelho dos jogos e
   registrei a regra: *brand-500 é preenchimento; texto vermelho é brand-600*.
   O erro de origem foi meu, no ciclo 13: medi contraste só contra branco.
2. **Nenhuma tela de jogo tinha `h1`** — quem usa leitor de tela não sabia onde
   estava. O nome do jogo na barra virou cabeçalho de verdade.

Também subi os cinzas dos jogos (`ink/40`, `/50`, `/55`, `/60`) para `ink/70`;
o placar da memória chegava a 2,45 de contraste. Reauditado: **os quatro jogos
sem violação**.

## Ciclo 36 — auditoria de regressão em acessibilidade

Muita interface entrou depois do ciclo 13 (edição de prêmios, código em tela
cheia, botões novos no painel). Rodei o axe-core de novo, **incluindo os estados
sobrepostos** que a auditoria anterior não cobriu: código ampliado e o sheet
"Como funciona" aberto.

Resultado: as quatro telas principais e o código em tela cheia seguem **sem
violação**. Uma regressão encontrada e corrigida: a área rolável do sheet não
era focável por teclado (`scrollable-region-focusable`, impacto sério) — quem
navega sem mouse não conseguia rolar pra ler o final, justamente onde está o
selo "sem dinheiro real, sem aposta". Recebeu `tabIndex={0}` e contorno visível
de foco. Reauditado: sem violações.

Lição de método: auditar só o estado inicial das telas deixa passar tudo que é
diálogo, sheet e overlay — que é onde mora boa parte da interface hoje.

## Ciclo 35 — o teclado do cliente estava atrapalhando

Continuando pelos gestos físicos: **digitar o código da mesa** é o que todo
cliente faz sentado à mesa. O campo do caixa (usado pelo dono) já tinha os
ajustes de teclado; **o do cliente não tinha nenhum**.

Sem eles, o iOS autocapitaliza como frase, oferece autocorreção em cima de um
código aleatório e o "Enter" não vira ação. Agora o campo tem
`autoCapitalize="characters"`, `autoCorrect/autoComplete="off"`,
`spellCheck={false}`, `maxLength` e `enterKeyHint="go"`, e o texto vira maiúsculo
de verdade enquanto se digita (antes só *parecia* maiúsculo por CSS).

Verificado: digitei o código em minúsculo, o campo mostrou "MEGEGV", e o Enter
resgatou direto — "+30 fichas na sua conta!".

## Ciclo 34 — o código em tela cheia, pensado pro garçom

Medições primeiro: Home 2,6 telas, carteira 1 tela, e **os quatro jogos cabem
sem rolagem** tanto em iPhone Pro (844px) quanto em iPhone SE (667px) — o
acúmulo de blocos não estragou as telas de jogo. Nada a corrigir ali.

Melhoria veio do momento mais físico do produto: **quem lê o código não é o
cliente, é o garçom** — de pé, no salão com pouca luz, olhando o celular da
outra pessoa. Agora um toque no código abre em **tela cheia, fundo escuro e tipo
gigante** (15vw), com o nome da casa e o prêmio acima. Fecha com toque em
qualquer lugar: ninguém quer caçar botão com o garçom esperando.

Só cupom válido amplia — usado ou expirado não abre, porque não há o que mostrar.

## Ciclo 33 — o painel voltou a caber numa demonstração

Medi o que 30 ciclos de acréscimos fizeram com a aba do parceiro: **3362px, 4
telas de rolagem**, com "Gerar códigos de mesa" — a segunda ação do dia a dia —
a duas telas do topo, depois da tabela de prêmios e do link.

Reordenado por frequência de uso real: **validar cupom → gerar códigos** (as
duas ações diárias, agora vizinhas) → métricas → tabela de prêmios → link →
explicações → lista de códigos. E a lista, que é material de consulta, mostra
os 5 mais recentes com um "Ver todos os N códigos" — 12 códigos de uma vez
empurravam tudo pra fora da tela.

Resultado medido: de 4,0 para **3,6 telas** com a lista recolhida, e o gerador
subiu de 1734px para 1072px. O que o dono usa todo dia cabe na primeira rolagem.

## Ciclo 32 — "a tabela é sua" virou verdade: prêmios editáveis

O ciclo 31 mostrou a tabela; agora o dono **troca o prêmio ali mesmo**. Toca na
linha, escreve o que a casa quer oferecer, salva. Vale no app inteiro na hora —
verificado: editei o prêmio grande da Potengi Camaroeira pra "Rodízio de camarão
pra dois" e a Home passou a anunciar "Prêmio máximo: Rodízio de camarão pra
dois"; a roleta carrega a tabela editada; "Voltar ao padrão" restaura.

Limite deliberado: **só o rótulo é editável, os pesos não**. A chance de cada
faixa é do produto — se cada casa mexesse nela, a economia (e o argumento de
custo) viraria outra coisa a cada restaurante. A chance segue visível ao lado do
prêmio justamente pra deixar claro o que muda e o que não muda.

Cupons já ganhos guardam o texto da época (o `prizeLabel` é copiado no momento
do ganho), então mudar a tabela não reescreve o passado de ninguém.

## Ciclo 31 — a tabela de prêmios do dono agora aparece

O ciclo 30 reescreveu o argumento pra dizer "a tabela de prêmios é sua: nada sai
dela sem você ter posto lá". Só que **a tabela não estava em lugar nenhum da
tela** — e "quais são os meus prêmios?" é a primeira pergunta que o dono faz
depois de ouvir isso.

Agora o painel mostra a tabela da casa selecionada com a **chance real de cada
prêmio**, calculada dos pesos (5% camarão grátis, 15% sobremesa, 20% + 20% os
dois pequenos, 40% "não foi dessa vez"). Sem número escrito à mão, seguindo a
regra dos ciclos 25-27; se os pesos mudarem, a tela acompanha. A linha de "não
foi dessa vez" aparece apagada, sem destaque — é informação, não promessa.

## Ciclo 30 — o painel afirmava ao dono algo que o app não cumpre

Verificação da promessa "o cupom só vale na casa que emitiu": **cumprida** —
cupom da Potengi Camaroeira testado no caixa da Pizzaria do Forte é recusado com
"Código não encontrado nesta casa · Nenhum cupom com NWM5AN em Pizzaria do
Forte".

Mas a mesma varredura pegou uma **contradição no argumento de venda**: o painel
dizia ao dono que "ninguém joga sem um código que você entregou". Não é verdade
— o app dá 50 fichas de boas-vindas, +30 por dia e recarga automática, tudo
usável em qualquer casa sem código nenhum. Um dono que lesse isso montaria o
custo dele numa premissa falsa e perderia a confiança no primeiro cliente que
ganhasse um cupom sem nunca ter recebido código.

Reescrito com o que é verdade **e continua sendo bom argumento**: a tabela de
prêmios é dele (nada sai dela sem ele ter posto), qualquer pessoa joga com as
fichas de cortesia (é o que traz gente nova), os códigos dão fichas extras a quem
já está na mesa, e — o ponto que importa — **o custo só existe quando alguém
aparece na casa com um cupom válido**. O título virou "Você define o prêmio e só
paga quando ele volta".


## Ciclo 29 — o QR na mesa não funcionaria pra cliente novo

Testei o cenário que o produto pressupõe: cliente abre um link direto da casa
(QR na mesa, story, WhatsApp do restaurante). **Quebrado** — quem nunca usou o
app era mandado pro onboarding e, ao terminar, despejado na Home, perdendo
justamente o restaurante que o trouxe. Ou seja, o material impresso do parceiro
falharia com o público que ele quer atingir: gente nova.

Agora o destino é guardado (`sessionStorage`) antes do desvio e devolvido no fim
do onboarding. Verificado ponta a ponta com estado zerado: abre
`#/r/pizzaria-forte` → onboarding → "Pular" → **cai na Pizzaria do Forte**.

E o dono passou a ter acesso a esse link: bloco "Link desta casa" no painel, com
botão copiar e a explicação de que serve como QR na mesa. Era uma capacidade que
já existia no app e ninguém sabia que existia.



## Ciclo 28 — "jogada" queria dizer duas coisas ao mesmo tempo

Varredura de vocabulário (contando cada termo na UI) revelou uma colisão real:
**jogada** era ao mesmo tempo (a) a partida que custa 10 fichas — "1 jogada =
10 fichas", "dá pra 19 jogadas" — e (b) o movimento dentro do jogo da memória,
onde o placar dizia "JOGADAS 20 RESTANTES".

Na mesma tela onde o HUD mostra o saldo em fichas, "20 jogadas restantes" podia
ser lido como 200 fichas guardadas. O contador da memória virou **"TENTATIVAS 20
RESTANTES"**, e as mensagens de fim acompanharam ("fechou os 8 pares com 5
tentativas sobrando").

Vocabulário do produto registrado no CLAUDE.md: ficha / jogada / tentativa /
casa / cupom / prêmio, cada um com um significado só.



## Ciclo 27 — o onboarding não dizia o que é uma ficha

Busca simples no `Welcome.tsx`: a palavra "ficha" aparecia **zero vez**. Ou
seja, a pessoa terminava a apresentação, chegava na Home e via uma moeda dourada
com "50" sem nenhuma pista do que aquilo era — sendo que ficha é a moeda que
move o app inteiro.

Agora o último slide, logo acima do "Começar", traz o selo: "Você começa com **50
fichas** — 5 jogadas por nossa conta". Enquadra como presente (que é o que é) e
faz o número do topo já chegar com significado. Valores vindos das constantes,
seguindo a regra dos ciclos 25-26 — inclusive a conta das 5 jogadas.

Regra registrada no CLAUDE.md: **número que o app afirma é derivado, nunca
digitado** — vale pra copy de produto e, principalmente, pras afirmações feitas
ao dono do restaurante.



## Ciclo 26 — o que o app afirma ao dono do restaurante agora é calculado

Continuação do ciclo 25, num lugar onde errar custa mais: o bloco "Por que ter o
BetFood na casa" faz **afirmações ao dono sobre o custo dele** — "a faixa 'não
foi dessa vez' pesa 40% do sorteio" e "ele ganha 50 fichas ao entrar e mais 30
por dia". Estavam escritas à mão. Mudar a tabela de prêmios de uma casa (coisa
que o produto promete que o dono controla) deixaria o painel afirmando um número
falso numa conversa comercial.

Agora os 40% saem da **tabela de prêmios da casa selecionada** (soma dos pesos
da faixa "none" sobre o total) e as fichas saem das constantes do store.
Verificado na tela: continua "40% do sorteio" e "50 ao entrar e mais 30 por dia",
mas agora porque foi calculado — e passa a acompanhar cada casa, já que a
tabela é por restaurante.



## Ciclo 25 — números da economia deixam de ser copiados à mão

Varredura de "exportado mas ninguém usa" (o mesmo método que achou o som de
nível esquecido no ciclo 24). Resultado: `WELCOME_CHIPS`, `REGEN_INTERVAL_MS` e
`REGEN_CAP` existiam no store e **a tela "Como funciona" repetia os mesmos
números escritos à mão** — "10 fichas", "50 fichas", "a cada 10 minutos, até
50". Bastava alguém ajustar a regra da economia pra explicação começar a mentir,
que é exatamente o erro do ciclo 21 esperando pra acontecer de novo.

Agora o sheet lê as constantes (`CHIP_COST`, `WELCOME_CHIPS`,
`DAILY_BONUS_CHIPS`, `REGEN_AMOUNT`, `REGEN_INTERVAL_MS`, `REGEN_CAP`), incluindo
a conta "50 ÷ 10 = 5 jogadas de boas-vindas". Verificado na tela: os textos saem
idênticos, mas agora seguem a regra sozinhos.

`findCouponByCode` e `isCouponExpired` seguem exportados de propósito
(documentado no código): são a base de uma futura tela de conferência sem baixa.



## Ciclo 24 — subir de nível deixou de ser invisível

O app tem cinco níveis (Bronze → Prata → Ouro → Chef → Lenda), dá XP a cada
partida e **tinha até o som pronto** (`levelup.mp3`, gerado no ElevenLabs) — que
nunca tocava. O jogador cruzava 100 XP e virava "Garfo de Prata" sem som, sem
aviso, sem nada. Num app cuja proposta é recompensa, era o momento mais
desperdiçado que restava.

Agora: som + confetti + um aviso "Subiu de nível · Garfo de Prata" que aparece
e sai sozinho em 4s, sem bloquear toque.

**Onde a implementação quase deu errado** (vale registrar): a primeira versão
guardava o último nível visto num `useRef` do HUD. Só que o HUD **é desmontado
durante a partida** — exatamente quando o XP sobe —, então ao voltar ele já
inicializava com o nível novo e nunca detectava a subida. A correção foi mover a
comparação pro `store` (`takeLevelUp()`, que consome a subida de forma atômica) e
o aviso pro `Layout`, que nunca desmonta. Verificado: aparece durante o jogo,
aparece na Home, e **não** dispara falso em instalação nova.



Cada entrada registra o que mudou e **por quê** — inclusive os erros cometidos,
que são o que evita repeti-los.


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

## Ciclo 22 — documentação que enganava quem abrisse o repo

O repositório é **público**: o Allan (ou qualquer pessoa) pode abrir. E os dois
arquivos de entrada estavam parados no começo do dia:

- **README** dizia "1 jogada grátis por dia por restaurante" e "código = +3
  jogadas" — mecânica que não existe desde a economia de fichas. Também não
  mencionava a URL no ar, o PWA, o offline, o som, o XP nem a validação de cupom
  no caixa. Reescrito: como o app funciona hoje, roteiro de demo, o que é o
  Capacitor (configurado, mas o caminho escolhido foi PWA porque os testes são em
  iPhone) e onde estão as convenções.
- **supabase/schema.sql** não tinha fichas, XP, streak, validade de cupom nem
  jogador. Atualizado pra espelhar o `store.ts` de hoje, com comentário no topo
  avisando que os dois andam em par.

Nada disso muda o app — muda o que uma pessoa entende ao chegar nele.


## Ciclo 23 — o arquivo de retomada estava desorientando

O topo do STATUS ainda dizia "fim do ciclo 4" e mandava conferir um deploy de
horas atrás, com 22 ciclos já feitos abaixo. Quem retomasse o projeto (eu numa
sessão nova, ou outra pessoa) seria mandado pra tarefa errada logo na primeira
leitura — que é justamente o que este arquivo existe pra evitar.

Reorganizado: **Onde está** (o app hoje, em quatro parágrafos), **Próxima ação**
(o que de fato falta: iPhone real e a decisão comercial), **Como trabalhar neste
repo** (aponta pro CLAUDE.md e as armadilhas já mapeadas), bloqueios, e só então
o histórico dos ciclos — agora em ordem cronológica, que estava embaralhada
(1, 3, 4 tinham ido parar depois do 22).
