import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import confetti from "canvas-confetti";
import { play } from "../../lib/sound";
import type { GameProps, Prize } from "../../lib/types";

// ---------------------------------------------------------------------------
// Banco de perguntas (fatos verificáveis de gastronomia potiguar/nordestina)
// ---------------------------------------------------------------------------

interface QuizQuestion {
  question: string;
  options: string[]; // 4 opções
  correct: number; // índice da correta em `options` (antes do embaralhamento)
}

const QUESTION_BANK: QuizQuestion[] = [
  {
    question: "A famosa \"ginga com tapioca\" é o prato símbolo de qual mercado de Natal?",
    options: ["Mercado da Redinha", "Mercado das Rocas", "Mercado de Petrópolis", "Mercado do Alecrim"],
    correct: 0,
  },
  {
    question: "A ginga, servida com tapioca em Natal, é o quê?",
    options: ["Um peixinho frito", "Um molho de pimenta", "Um tipo de camarão", "Uma alga marinha"],
    correct: 0,
  },
  {
    question: "O maior cajueiro do mundo fica em qual praia do Rio Grande do Norte?",
    options: ["Pirangi", "Ponta Negra", "Genipabu", "Maracajaú"],
    correct: 0,
  },
  {
    question: "A carne de sol é tradicionalmente conservada como?",
    options: ["Com sal e um leve processo de secagem", "Congelada em gelo", "Mergulhada em vinagre", "Defumada em folhas de bananeira"],
    correct: 0,
  },
  {
    question: "O queijo coalho, queridinho do Nordeste, é famoso por ser servido de que jeito?",
    options: ["Assado no espeto, na brasa", "Derretido em fondue", "Cru com mel de abelha apenas", "Frito em massa de pastel"],
    correct: 0,
  },
  {
    question: "O cuscuz nordestino, presença certa no café da manhã, é feito de quê?",
    options: ["Flocos de milho", "Trigo para quibe", "Arroz moído", "Fubá de mandioca"],
    correct: 0,
  },
  {
    question: "A goma usada para fazer tapioca vem de qual planta?",
    options: ["Mandioca", "Milho", "Batata-doce", "Inhame"],
    correct: 0,
  },
  {
    question: "O baião de dois é a mistura de arroz com qual outro ingrediente?",
    options: ["Feijão", "Macarrão", "Carne moída", "Ovo mexido"],
    correct: 0,
  },
  {
    question: "A rapadura, doce clássico do sertão, é feita a partir de quê?",
    options: ["Caldo de cana", "Leite de cabra", "Mel de engenho de milho", "Polpa de caju"],
    correct: 0,
  },
  {
    question: "A buchada, prato tradicional do sertão nordestino, é feita principalmente com qual animal?",
    options: ["Bode", "Boi", "Galinha", "Porco"],
    correct: 0,
  },
  {
    question: "\"Macaxeira\", como se diz no Nordeste, é o mesmo que...",
    options: ["Mandioca (aipim)", "Batata-doce", "Cará", "Abóbora"],
    correct: 0,
  },
  {
    question: "Qual fruto do mar é a estrela da cozinha potiguar, criado em viveiros no litoral do RN?",
    options: ["Camarão", "Lagosta", "Ostra", "Polvo"],
    correct: 0,
  },
  {
    question: "A paçoca de carne seca do sertão é feita pilando a carne com o quê?",
    options: ["Farinha de mandioca", "Farinha de trigo", "Açúcar mascavo", "Fubá de milho"],
    correct: 0,
  },
  {
    question: "O caju que vira suco e doce no Nordeste é, botanicamente, o quê?",
    options: [
      "O pedúnculo — a castanha é o fruto",
      "O fruto, e a castanha é a semente",
      "Uma flor amadurecida",
      "Uma raiz aérea",
    ],
    correct: 0,
  },
  {
    question: "A moqueca capixaba se diferencia da baiana principalmente por não levar...",
    options: ["Leite de coco e dendê", "Tomate", "Coentro", "Cebola"],
    correct: 0,
  },
  {
    question: "O que é o \"pirão\" que acompanha peixe e camarão no litoral nordestino?",
    options: [
      "Caldo engrossado com farinha de mandioca",
      "Arroz cozido no caldo do peixe",
      "Purê de batata com azeite",
      "Molho de pimenta com limão",
    ],
    correct: 0,
  },
  {
    question: "A tapioca de Natal fica pronta na chapa quando a goma...",
    options: [
      "Se aglutina com o calor, sem precisar de óleo",
      "É frita em óleo quente",
      "Cozinha em água fervente",
      "Vai ao forno por 20 minutos",
    ],
    correct: 0,
  },
  {
    question: "Qual peixe é o mais tradicional na mesa do litoral potiguar?",
    options: ["Pescada amarela", "Salmão", "Bacalhau", "Truta"],
    correct: 0,
  },
  {
    question: "O bolo de rolo, doce típico do Nordeste, é enrolado com recheio de quê?",
    options: ["Goiabada", "Doce de leite", "Chocolate", "Coco queimado"],
    correct: 0,
  },
  {
    question: "A castanha de caju é beneficiada de que forma antes de ir pra mesa?",
    options: [
      "Assada ou cozida pra retirar o líquido cáustico da casca",
      "Só lavada em água corrente",
      "Congelada por 24 horas",
      "Curtida no sal por uma semana",
    ],
    correct: 0,
  },
  {
    question: "O sarapatel, prato do Nordeste, leva principalmente...",
    options: ["Vísceras de porco ou bode", "Peixe defumado", "Frango desfiado", "Camarão seco"],
    correct: 0,
  },
  {
    question: "A farofa de dendê e o vatapá são marcas de qual cozinha regional?",
    options: ["Baiana", "Gaúcha", "Mineira", "Paranaense"],
    correct: 0,
  },
  {
    question: "Em Natal, o \"beiju\" é parente próximo de qual outra preparação?",
    options: ["Tapioca", "Cuscuz", "Pão de queijo", "Polenta"],
    correct: 0,
  },
  {
    question: "O leite de coco, base de muitos pratos nordestinos, é extraído de quê?",
    options: [
      "Da polpa ralada do coco maduro, espremida",
      "Da água que fica dentro do coco",
      "Da casca fibrosa moída",
      "Do broto da palmeira",
    ],
    correct: 0,
  },
];

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Sorteia 3 perguntas e embaralha as opções de cada uma. */
function drawQuestions(): QuizQuestion[] {
  return shuffle(QUESTION_BANK)
    .slice(0, 3)
    .map((q) => {
      const order = shuffle(q.options.map((_, i) => i));
      return {
        question: q.question,
        options: order.map((i) => q.options[i]),
        correct: order.indexOf(q.correct),
      };
    });
}

const TOTAL_QUESTIONS = 3;
const TIME_PER_QUESTION = 15_000; // ms
const TICK = 100; // ms
const FEEDBACK_DELAY = 1_800; // ms
const COUNTUP_STEP = 380; // ms entre pontos na contagem final
const FLY_MS = 620; // duração do "+1" voando até o placar

// Verde de acerto / vermelho terroso de erro (feedback, não ação).
// Tons escurecidos pra passar AA como texto e como fundo de texto branco.
const OK = "#1a7f52";
const BAD = "#a85751";
const CONFETTI_COLORS = ["#ea1d2c", "#f5a623", "#ffffff"];

type Phase = "intro" | "question" | "feedback" | "end";

// ---------------------------------------------------------------------------
// Keyframes locais (palco game-show)
// ---------------------------------------------------------------------------

const localCss = `
  /* "+1" parte da opção certa e voa até o placar (deltas via CSS vars) */
  @keyframes quiz-fly {
    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
    14% { transform: translate(-50%, -50%) scale(1.35); opacity: 1; }
    28% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
    100% {
      transform: translate(calc(-50% + var(--fly-dx)), calc(-50% + var(--fly-dy))) scale(0.45);
      opacity: 0;
    }
  }
  .quiz-fly { animation: quiz-fly ${FLY_MS}ms cubic-bezier(0.5, -0.15, 0.65, 1) both; }

  /* placar "engole" o ponto e pulsa */
  @keyframes quiz-score-pump {
    0% { transform: scale(1); }
    35% { transform: scale(1.5); color: ${OK}; }
    100% { transform: scale(1); }
  }
  .quiz-score-pump { animation: quiz-score-pump 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

  /* pulso cardíaco do bloco do timer nos últimos 5s */
  @keyframes quiz-heartbeat {
    0%, 100% { transform: scale(1); }
    14% { transform: scale(1.018); }
    28% { transform: scale(1); }
    42% { transform: scale(1.012); }
    56% { transform: scale(1); }
  }
  .quiz-heartbeat { animation: quiz-heartbeat 1s ease-in-out infinite; transform-origin: 50% 50%; }

  /* check / x desenhados por stroke */
  @keyframes quiz-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
  .quiz-draw { stroke-dasharray: 1; animation: quiz-draw 0.45s ease-out 0.08s both; }

  /* tremida curta na opção errada escolhida */
  @keyframes quiz-shake {
    10%, 90% { transform: translateX(-1px); }
    20%, 80% { transform: translateX(2px); }
    30%, 50%, 70% { transform: translateX(-3px); }
    40%, 60% { transform: translateX(3px); }
  }
  .quiz-shake { animation: quiz-shake 0.45s ease both; }

  /* respiro de vitória na opção certa */
  @keyframes quiz-correct-pop {
    0% { transform: scale(1); }
    40% { transform: scale(1.035); }
    100% { transform: scale(1); }
  }
  .quiz-correct-pop { animation: quiz-correct-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

  @media (prefers-reduced-motion: reduce) {
    .quiz-fly, .quiz-score-pump, .quiz-heartbeat, .quiz-draw, .quiz-shake, .quiz-correct-pop {
      animation: none;
    }
    .quiz-fly { opacity: 0; }
  }
`;

/** Vinheta radial sutil: escurece as bordas do palco sem sair do tema claro. */
function Vignette() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background:
          "radial-gradient(130% 100% at 50% 26%, transparent 50%, rgba(32,30,29,0.11) 100%)",
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Ícones (linha stroke; check/x desenham o traço quando `draw`)
// ---------------------------------------------------------------------------

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="#f5a623" className="h-3.5 w-3.5 shrink-0" aria-hidden>
      <path d="M12 2.5l2.95 5.98 6.6.96-4.78 4.66 1.13 6.58L12 17.58l-5.9 3.1 1.13-6.58L2.45 9.44l6.6-.96L12 2.5z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="h-3.5 w-3.5 shrink-0"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="h-3.5 w-3.5 shrink-0"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.5" fill="currentColor" />
    </svg>
  );
}

function CheckIcon({ draw = false }: { draw?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0"
      aria-hidden
    >
      <path d="m5 12.5 4.5 4.5L19 7.5" pathLength={1} className={draw ? "quiz-draw" : undefined} />
    </svg>
  );
}

function CrossIcon({ draw = false }: { draw?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      className="h-5 w-5 shrink-0"
      aria-hidden
    >
      <path
        d="M6.5 6.5l11 11M17.5 6.5l-11 11"
        pathLength={1}
        className={draw ? "quiz-draw" : undefined}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

interface FlyPoint {
  x: number;
  y: number;
  dx: number;
  dy: number;
  key: number;
}

function Quiz({ restaurant, drawPrize, startPlay, onFinish }: GameProps) {
  const questions = useMemo(drawQuestions, []);
  const [phase, setPhase] = useState<Phase>("intro");
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null); // null = tempo esgotado
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [finalResult, setFinalResult] = useState<{ won: boolean; prize?: Prize } | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const [headerScore, setHeaderScore] = useState(0); // placar visível (recebe o ponto DEPOIS do voo)
  const [fly, setFly] = useState<FlyPoint | null>(null);
  const finishedRef = useRef(false);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const lastTickSecondRef = useRef<number | null>(null);

  // Timeouts agendados pelo fluxo de resposta: cancelados no unmount pra não
  // avançar pergunta nem creditar rodada abandonada (mesmo padrão da roleta).
  const timeoutsRef = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => {
    timeoutsRef.current.push(window.setTimeout(fn, ms));
  };
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((t) => window.clearTimeout(t));
      timeoutsRef.current = [];
    };
  }, []);

  const current = questions[idx];

  // Timer da pergunta atual
  useEffect(() => {
    if (phase !== "question") return;
    const interval = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - TICK));
    }, TICK);
    return () => clearInterval(interval);
  }, [phase, idx]);

  // Som "tick" a cada segundo nos últimos 5s
  useEffect(() => {
    if (phase !== "question") {
      lastTickSecondRef.current = null;
      return;
    }
    if (timeLeft <= 5_000 && timeLeft > 0) {
      const s = Math.ceil(timeLeft / 1000);
      if (lastTickSecondRef.current !== s) {
        lastTickSecondRef.current = s;
        play("tick", { volume: 0.3 });
      }
    }
  }, [timeLeft, phase]);

  // Tempo esgotado = erro
  useEffect(() => {
    if (phase === "question" && timeLeft <= 0) answer(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  // Contagem animada do placar na tela final
  useEffect(() => {
    if (phase !== "end") return;
    setDisplayScore(0);
    if (score === 0) return;
    let n = 0;
    const interval = setInterval(() => {
      n += 1;
      setDisplayScore(n);
      play("tick", { volume: 0.3 });
      if (n >= score) clearInterval(interval);
    }, COUNTUP_STEP);
    return () => clearInterval(interval);
  }, [phase, score]);

  function answer(option: number | null, sourceEl?: HTMLElement | null) {
    if (phase !== "question") return;
    const hit = option !== null && option === current.correct;
    play(hit ? "correct" : "wrong");
    const newScore = hit ? score + 1 : score;
    setScore(newScore);
    setSelected(option);
    setPhase("feedback");

    // Ponto voando: "+1" parte da opção certa e voa até o placar no topo
    if (hit && sourceEl && scoreRef.current) {
      const from = sourceEl.getBoundingClientRect();
      const to = scoreRef.current.getBoundingClientRect();
      setFly({
        x: from.left + from.width / 2,
        y: from.top + from.height / 2,
        dx: to.left + to.width / 2 - (from.left + from.width / 2),
        dy: to.top + to.height / 2 - (from.top + from.height / 2),
        key: Date.now(),
      });
      later(() => {
        setFly(null);
        setHeaderScore(newScore); // o placar "recebe" o ponto e pulsa
      }, FLY_MS);
    } else if (hit) {
      setHeaderScore(newScore);
    }

    later(() => {
      if (idx + 1 < TOTAL_QUESTIONS) {
        setIdx(idx + 1);
        setSelected(null);
        setTimeLeft(TIME_PER_QUESTION);
        setPhase("question");
      } else {
        endGame(newScore);
      }
    }, FEEDBACK_DELAY);
  }

  function endGame(finalScore: number) {
    let result: { won: boolean; prize?: Prize };
    if (finalScore >= 2) {
      const prize = drawPrize();
      result = { won: prize.tier !== "none", prize };
    } else {
      result = { won: false };
    }
    if (result.won) {
      play("win");
      confetti({
        particleCount: 120,
        spread: 75,
        origin: { y: 0.6 },
        colors: CONFETTI_COLORS,
      });
    } else {
      play("lose");
    }
    setFinalResult(result);
    setPhase("end");
  }

  function finish() {
    if (finishedRef.current || !finalResult) return;
    finishedRef.current = true;
    onFinish(finalResult);
  }

  // ---------------------------------------------------------------- telas

  if (phase === "intro") {
    return (
      <div className="relative px-5 py-6">
        <style>{localCss}</style>
        <Vignette />
        <div className="anim-fade-up relative z-10 overflow-hidden rounded-card bg-white shadow-lg shadow-ink/10">
          {/* Hero com a foto do prato da casa */}
          <div className="relative h-44 overflow-hidden">
            {!imgLoaded && <div className="absolute inset-0 animate-pulse bg-surface" />}
            <img
              src={restaurant.photo}
              alt={restaurant.name}
              onLoad={() => setImgLoaded(true)}
              className={`h-full w-full object-cover transition-opacity duration-500 ${
                imgLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 px-4 pb-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">
                  Quiz gastronômico
                </p>
                <p className="truncate font-display text-xl font-bold text-white">
                  {restaurant.name}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-ink shadow-sm">
                <StarIcon />
                {restaurant.rating.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="p-5">
            <h2
              className="anim-fade-up font-display text-2xl font-bold tracking-tight"
              style={{ animationDelay: "80ms" }}
            >
              3 perguntas. 2 acertos. Prêmio na mesa.
            </h2>
            <p
              className="anim-fade-up mt-2 text-sm leading-relaxed text-ink/70"
              style={{ animationDelay: "140ms" }}
            >
              Comida daqui, resposta rápida — quem conhece o sabor da terra leva.
            </p>
            <div className="anim-fade-up mt-4 flex flex-wrap gap-2" style={{ animationDelay: "200ms" }}>
              <span className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
                <ClockIcon />
                15s por pergunta
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
                <TargetIcon />2 de 3 libera o prêmio
              </span>
            </div>
            <button
              className="press anim-fade-up mt-5 w-full rounded-full bg-brand-500 py-4 font-display text-base font-bold text-white shadow-lg shadow-brand-500/30 transition-colors hover:bg-brand-600 active:bg-brand-600"
              style={{ animationDelay: "260ms" }}
              onClick={() => {
                // "Valendo" é o início real da rodada: cobra aqui. Sem saldo, a
                // intro fica onde está (o GamePlay troca pra tela de reposição).
                if (!startPlay()) return;
                play("tap");
                setPhase("question");
              }}
            >
              Valendo
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "end" && finalResult) {
    const won = finalResult.won;
    return (
      <div className="relative px-5 py-8">
        <style>{localCss}</style>
        <Vignette />
        <div className="anim-pop relative z-10 rounded-card bg-white p-6 text-center shadow-lg shadow-ink/10">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink/65">
            Fim de jogo
          </p>
          <p
            className="mt-4 font-display text-[64px] font-bold leading-none tracking-tight"
            style={{ color: won ? OK : BAD }}
          >
            <span key={displayScore} className="anim-pop inline-block">
              {displayScore}
            </span>
            <span className="text-2xl text-ink/70"> /{TOTAL_QUESTIONS}</span>
          </p>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-ink/65">
            Respostas certas
          </p>
          <h2 className="mt-5 font-display text-2xl font-bold tracking-tight">
            {won ? "Acertou, ganhou" : score >= 2 ? "Jogou bem, sorte curta" : "Não foi dessa vez"}
          </h2>
          {won && finalResult.prize && (
            <p
              className="anim-pop mx-auto mt-3 inline-block rounded-full px-4 py-1.5 text-sm font-bold"
              style={{ background: "rgba(245,166,35,0.16)", color: "#8a5a00", animationDelay: "200ms" }}
            >
              {finalResult.prize.label}
            </p>
          )}
          <p className="mt-3 text-sm leading-relaxed text-ink/70">
            {won
              ? "Conhecimento vale prêmio por aqui. Bom apetite."
              : score >= 2
                ? "Mandou bem no quiz — dessa vez o sorteio não ajudou."
                : "Agora você já sabe as respostas. Vale voltar pra revanche."}
          </p>
          <button
            className="press mt-6 w-full rounded-full bg-brand-500 py-4 font-display text-base font-bold text-white shadow-lg shadow-brand-500/30 transition-colors hover:bg-brand-600 active:bg-brand-600"
            onClick={finish}
          >
            Ver resultado
          </button>
        </div>
      </div>
    );
  }

  // Fases "question" e "feedback"
  const timePct = (timeLeft / TIME_PER_QUESTION) * 100;
  const urgent = timeLeft <= 5_000;
  const secondsLeft = Math.ceil(timeLeft / 1000);

  return (
    <div className="relative px-5 py-5">
      <style>{localCss}</style>
      <Vignette />

      {/* "+1" voando da opção certa até o placar */}
      {fly && (
        <span
          key={fly.key}
          aria-hidden
          className="quiz-fly pointer-events-none fixed z-50 font-display text-2xl font-extrabold"
          style={
            {
              left: fly.x,
              top: fly.y,
              color: OK,
              textShadow: "0 2px 10px rgba(26,127,82,0.35)",
              "--fly-dx": `${fly.dx}px`,
              "--fly-dy": `${fly.dy}px`,
            } as CSSProperties
          }
        >
          +1
        </span>
      )}

      <div className="relative z-10">
        {/* Placar do palco: rótulo à esquerda, acertos + cronômetro à direita */}
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-600">
            Quiz gastronômico
          </p>
          <div className="flex items-center gap-2">
            <span
              ref={scoreRef}
              className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-ink/65 shadow-sm"
            >
              Acertos
              <span
                key={headerScore}
                className={`font-display text-base leading-none tracking-normal text-ink ${
                  headerScore > 0 ? "quiz-score-pump" : ""
                }`}
              >
                {headerScore}
              </span>
            </span>
          </div>
        </div>

        {/* Timer: barra grossa + pulso cardíaco nos últimos 5s */}
        <div className={`mb-4 ${urgent && phase === "question" ? "quiz-heartbeat" : ""}`}>
          <div className="flex items-center gap-2.5">
            <span
              className={`flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full px-2 font-display text-base font-bold shadow-sm transition-colors ${
                urgent ? "animate-pulse bg-brand-500 text-white" : "bg-white text-ink"
              }`}
            >
              {secondsLeft}
            </span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-ink/10">
              <div
                className={`h-full rounded-full bg-brand-500 transition-[width] duration-100 ease-linear ${
                  urgent ? "animate-pulse" : ""
                }`}
                style={{ width: `${timePct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Palco da pergunta: número GIGANTE translúcido atrás do cartão */}
        <div className="relative">
          <p
            key={`bg-${idx}`}
            aria-hidden
            className="anim-pop pointer-events-none absolute inset-x-0 -top-9 select-none text-center font-display text-[132px] font-extrabold leading-none tracking-tighter text-ink/[0.05]"
          >
            {idx + 1}
            <span className="text-[64px]">/{TOTAL_QUESTIONS}</span>
          </p>

          {/* Pergunta */}
          <div
            key={idx}
            className="anim-fade-up relative z-10 mb-4 mt-10 rounded-card bg-white p-5 shadow-md shadow-ink/5"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/65">
              Pergunta {idx + 1} de {TOTAL_QUESTIONS}
            </p>
            <p className="mt-1.5 font-display text-lg font-bold leading-snug">{current.question}</p>
          </div>

          {/* Opções */}
          <div className="relative z-10 flex flex-col gap-2.5">
            {current.options.map((opt, i) => {
              const isCorrect = i === current.correct;
              const isPicked = selected === i;
              const base =
                "press anim-fade-up flex items-center gap-3 rounded-card border-2 px-4 py-3.5 text-left text-sm font-semibold transition-colors";
              let cls = `${base} border-transparent bg-white shadow-sm hover:border-brand-100 active:border-brand-500`;
              let style: CSSProperties = { animationDelay: `${100 + i * 60}ms` };
              let letterCls = "bg-surface text-ink/70";
              if (phase === "feedback") {
                if (isCorrect) {
                  cls = `${base} quiz-correct-pop border-transparent text-white shadow-lg`;
                  style = { ...style, background: OK, boxShadow: "0 8px 22px -6px rgba(26,127,82,0.55)" };
                  letterCls = "bg-white/20 text-white";
                } else if (isPicked) {
                  cls = `${base} quiz-shake border-transparent text-white`;
                  style = { ...style, background: BAD };
                  letterCls = "bg-white/20 text-white";
                } else {
                  cls = `${base} border-transparent bg-white opacity-40`;
                }
              }
              return (
                <button
                  key={`${idx}-${i}`}
                  className={cls}
                  style={style}
                  disabled={phase === "feedback"}
                  onClick={(e) => answer(i, e.currentTarget)}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold transition-colors ${letterCls}`}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1">{opt}</span>
                  {phase === "feedback" && isCorrect && (
                    <span className="anim-pop">
                      <CheckIcon draw />
                    </span>
                  )}
                  {phase === "feedback" && isPicked && !isCorrect && (
                    <span className="anim-pop">
                      <CrossIcon draw />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback textual */}
        {phase === "feedback" && (
          <p
            className="anim-fade-up mt-4 text-center text-sm font-bold"
            style={{ color: selected === current.correct ? OK : BAD }}
          >
            {selected === current.correct
              ? "Na mosca."
              : selected === null
                ? "Tempo esgotado — a certa está em verde."
                : "Não era essa — a certa está em verde."}
          </p>
        )}
      </div>
    </div>
  );
}

// Default export: o registro (id/name/tagline) mora em src/games/index.ts, que
// carrega este módulo sob demanda via React.lazy.
export default Quiz;
