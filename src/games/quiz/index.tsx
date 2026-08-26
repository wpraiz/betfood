import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import confetti from "canvas-confetti";
import { play } from "../../lib/sound";
import type { GameDefinition, GameProps, Prize } from "../../lib/types";

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

// Verde vibrante de acerto; o erro usa o próprio brand-500
const OK = "#22a06b";
const CONFETTI_COLORS = ["#ea1d2c", "#f5a623", "#ffffff"];

type Phase = "intro" | "question" | "feedback" | "end";

// ---------------------------------------------------------------------------
// Ícones (linha stroke 1.8; preenchidos quando ativos)
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

function CheckIcon() {
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
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

function CrossIcon() {
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
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

function Quiz({ restaurant, drawPrize, onFinish }: GameProps) {
  const questions = useMemo(drawQuestions, []);
  const [phase, setPhase] = useState<Phase>("intro");
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null); // null = tempo esgotado
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [finalResult, setFinalResult] = useState<{ won: boolean; prize?: Prize } | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const finishedRef = useRef(false);

  const current = questions[idx];

  // Timer da pergunta atual
  useEffect(() => {
    if (phase !== "question") return;
    const interval = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - TICK));
    }, TICK);
    return () => clearInterval(interval);
  }, [phase, idx]);

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
      if (n >= score) clearInterval(interval);
    }, COUNTUP_STEP);
    return () => clearInterval(interval);
  }, [phase, score]);

  function answer(option: number | null) {
    if (phase !== "question") return;
    const hit = option !== null && option === current.correct;
    play(hit ? "correct" : "wrong");
    const newScore = hit ? score + 1 : score;
    setScore(newScore);
    setSelected(option);
    setPhase("feedback");

    setTimeout(() => {
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
      <div className="px-5 py-6">
        <div className="anim-fade-up overflow-hidden rounded-card bg-white shadow-lg shadow-ink/10">
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
              className="anim-fade-up mt-2 text-sm leading-relaxed text-ink/60"
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
      <div className="px-5 py-8">
        <div className="anim-pop rounded-card bg-white p-6 text-center shadow-lg shadow-ink/10">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink/40">
            Fim de jogo
          </p>
          <p
            className="mt-4 font-display text-[64px] font-bold leading-none tracking-tight"
            style={{ color: won ? OK : "var(--color-brand-500)" }}
          >
            {displayScore}
            <span className="text-2xl text-ink/25"> /{TOTAL_QUESTIONS}</span>
          </p>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-ink/40">
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
          <p className="mt-3 text-sm leading-relaxed text-ink/60">
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
    <div className="px-5 py-5">
      {/* Cabeçalho: número grande + contagem regressiva */}
      <div className="mb-3 flex items-end justify-between">
        <p className="font-display text-4xl font-bold leading-none tracking-tight">
          {idx + 1}
          <span className="text-xl font-bold text-ink/30">/{TOTAL_QUESTIONS}</span>
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40">
            Acertos <span className="font-display text-sm text-ink">{score}</span>
          </span>
          <span
            className={`flex h-9 min-w-9 items-center justify-center rounded-full px-2 font-display text-base font-bold shadow-sm transition-colors ${
              urgent ? "animate-pulse bg-brand-500 text-white" : "bg-white text-ink"
            }`}
          >
            {secondsLeft}
          </span>
        </div>
      </div>

      {/* Barra de tempo grossa */}
      <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-ink/10">
        <div
          className={`h-full rounded-full bg-brand-500 transition-[width] duration-100 ease-linear ${
            urgent ? "animate-pulse" : ""
          }`}
          style={{ width: `${timePct}%` }}
        />
      </div>

      {/* Pergunta */}
      <div key={idx} className="anim-fade-up mb-4 rounded-card bg-white p-5 shadow-md shadow-ink/5">
        <p className="font-display text-lg font-bold leading-snug">{current.question}</p>
      </div>

      {/* Opções */}
      <div className="flex flex-col gap-2.5">
        {current.options.map((opt, i) => {
          const isCorrect = i === current.correct;
          const isPicked = selected === i;
          const base =
            "press anim-fade-up flex items-center gap-3 rounded-card border-2 px-4 py-3.5 text-left text-sm font-semibold transition-colors";
          let cls = `${base} border-transparent bg-white shadow-sm hover:border-brand-100 active:border-brand-500`;
          let style: CSSProperties = { animationDelay: `${100 + i * 60}ms` };
          let letterCls = "bg-surface text-ink/50";
          if (phase === "feedback") {
            if (isCorrect) {
              cls = `${base} border-transparent text-white`;
              style = { ...style, background: OK };
              letterCls = "bg-white/20 text-white";
            } else if (isPicked) {
              cls = `${base} border-transparent bg-brand-500 text-white`;
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
              onClick={() => answer(i)}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold transition-colors ${letterCls}`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">{opt}</span>
              {phase === "feedback" && isCorrect && (
                <span className="anim-pop">
                  <CheckIcon />
                </span>
              )}
              {phase === "feedback" && isPicked && !isCorrect && (
                <span className="anim-pop">
                  <CrossIcon />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback textual */}
      {phase === "feedback" && (
        <p
          className="anim-fade-up mt-4 text-center text-sm font-bold"
          style={{ color: selected === current.correct ? OK : "var(--color-brand-500)" }}
        >
          {selected === current.correct
            ? "Na mosca."
            : selected === null
              ? "Tempo esgotado — a certa está em verde."
              : "Não era essa — a certa está em verde."}
        </p>
      )}
    </div>
  );
}

export const quiz: GameDefinition = {
  id: "quiz",
  name: "Quiz Gastronômico",
  tagline: "Acerte e leve o prêmio",
  component: Quiz,
};
