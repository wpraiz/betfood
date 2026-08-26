import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
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

// Cores sóbrias de feedback (fora da paleta Tailwind de propósito)
const OK = "#6f8f6a"; // verde sóbrio
const ERR = "#a85751"; // vermelho sóbrio

type Phase = "intro" | "question" | "feedback" | "end";

// ---------------------------------------------------------------------------
// Ícones (linha, stroke 1.6)
// ---------------------------------------------------------------------------

function CheckIcon({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
      aria-hidden
    >
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

function CrossIcon({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      className="h-4 w-4 shrink-0"
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

  function answer(option: number | null) {
    if (phase !== "question") return;
    const hit = option !== null && option === current.correct;
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
      confetti({
        particleCount: 70,
        spread: 55,
        origin: { y: 0.6 },
        colors: ["#0088b0", "#d6006c", "#201e1d", "#bd9b57"],
      });
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
      <div className="px-5 py-8">
        <div className="rounded-card border border-ink/10 bg-white p-6 shadow-sm">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/40">
            Quiz gastronômico
          </p>
          <h2 className="mb-3 font-display text-2xl font-bold tracking-tight">
            Três perguntas, um prêmio
          </h2>
          <p className="mb-2 text-sm leading-relaxed text-ink/60">
            Perguntas sobre a boa comida daqui, no clima do{" "}
            <span className="font-semibold text-ink">{restaurant.name}</span>.
          </p>
          <p className="mb-6 text-sm leading-relaxed text-ink/50">
            Você tem 15 segundos por pergunta. Acertando duas ou mais, concorre ao prêmio.
          </p>
          <button
            className="w-full rounded-card bg-brand-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 active:bg-brand-700"
            onClick={() => setPhase("question")}
          >
            Começar
          </button>
        </div>
      </div>
    );
  }

  if (phase === "end" && finalResult) {
    return (
      <div className="px-5 py-8">
        <div className="rounded-card border border-ink/10 bg-white p-6 text-center shadow-sm">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/40">
            Fim de jogo
          </p>
          <h2 className="mb-4 font-display text-2xl font-bold tracking-tight">
            {finalResult.won
              ? "Muito bem jogado"
              : score >= 2
                ? "Quase — a sorte não ajudou"
                : "Não foi dessa vez"}
          </h2>
          <p className="mb-1 font-display text-4xl font-bold" style={{ color: restaurant.accent }}>
            {score}
            <span className="text-ink/30"> / {TOTAL_QUESTIONS}</span>
          </p>
          <p className="mb-6 mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/40">
            Respostas certas
          </p>
          <p className="mb-6 text-sm leading-relaxed text-ink/60">
            {finalResult.won
              ? "Seu conhecimento gastronômico rendeu prêmio. Bom apetite."
              : score >= 2
                ? "Você jogou bem — na próxima o prêmio vem."
                : "Sem pressa: agora você já conhece as respostas. Vale tentar de novo."}
          </p>
          <button
            className="w-full rounded-card bg-brand-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 active:bg-brand-700"
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

  return (
    <div className="px-5 py-4">
      {/* Progresso + placar */}
      <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/40">
        <span>
          Pergunta {idx + 1} de {TOTAL_QUESTIONS}
        </span>
        <span>
          Acertos <span className="text-ink">{score}</span>
        </span>
      </div>

      {/* Barra de tempo */}
      <div className="mb-5 h-1 overflow-hidden bg-ink/10">
        <div
          className="h-full transition-[width] duration-100 ease-linear"
          style={{
            width: `${timePct}%`,
            background: urgent ? ERR : "var(--color-brand-500)",
          }}
        />
      </div>

      {/* Pergunta */}
      <div className="mb-4 rounded-card border border-ink/10 bg-white p-5 shadow-sm">
        <p className="font-display text-lg font-semibold leading-snug">{current.question}</p>
      </div>

      {/* Opções */}
      <div className="flex flex-col gap-2">
        {current.options.map((opt, i) => {
          const isCorrect = i === current.correct;
          const isPicked = selected === i;
          const base =
            "flex items-center gap-3 rounded-card border px-4 py-3 text-left text-sm transition-colors";
          let cls = `${base} border-ink/15 bg-white hover:bg-brand-50 active:bg-brand-50`;
          let style: React.CSSProperties | undefined;
          if (phase === "feedback") {
            if (isCorrect) {
              cls = `${base} font-semibold`;
              style = { borderColor: OK, background: `${OK}14`, color: "#3f5a3b" };
            } else if (isPicked) {
              cls = `${base} font-semibold`;
              style = { borderColor: ERR, background: `${ERR}14`, color: "#7a3c37" };
            } else {
              cls = `${base} border-ink/10 bg-white opacity-45`;
            }
          }
          return (
            <button
              key={i}
              className={cls}
              style={style}
              disabled={phase === "feedback"}
              onClick={() => answer(i)}
            >
              <span className="w-4 shrink-0 font-display text-sm font-semibold text-ink/35">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">{opt}</span>
              {phase === "feedback" && isCorrect && <CheckIcon color={OK} />}
              {phase === "feedback" && isPicked && !isCorrect && <CrossIcon color={ERR} />}
            </button>
          );
        })}
      </div>

      {/* Feedback textual */}
      {phase === "feedback" && (
        <p
          className="mt-4 text-center text-sm font-semibold"
          style={{ color: selected === current.correct ? OK : ERR }}
        >
          {selected === current.correct
            ? "Resposta certa."
            : selected === null
              ? "Tempo esgotado — a correta está destacada."
              : "Não era essa — a correta está destacada."}
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
