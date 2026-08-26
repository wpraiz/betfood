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

type Phase = "intro" | "question" | "feedback" | "end";

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
      confetti({ particleCount: 120, spread: 75, origin: { y: 0.6 } });
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
      <div className="p-6 text-center text-white">
        <div className="mb-3 text-5xl">🧠</div>
        <h2 className="mb-2 text-xl font-black">Quiz Gastronômico</h2>
        <p className="mb-1 text-sm text-white/80">
          3 perguntas sobre a boa comida daqui, no clima do {restaurant.emoji}{" "}
          <span className="font-bold">{restaurant.name}</span>.
        </p>
        <p className="mb-6 text-sm text-white/60">
          Você tem 15 segundos por pergunta. Acertando 2 ou mais, vale prêmio!
        </p>
        <button
          className="rounded-xl bg-brand-600 px-8 py-3 font-bold transition hover:bg-brand-500 active:scale-95"
          onClick={() => setPhase("question")}
        >
          Valendo!
        </button>
      </div>
    );
  }

  if (phase === "end" && finalResult) {
    return (
      <div className="p-6 text-center text-white">
        <div className="mb-3 text-5xl">{finalResult.won ? "🎉" : score >= 2 ? "🍀" : "😋"}</div>
        <h2 className="mb-2 text-xl font-black">
          {finalResult.won
            ? "Mandou bem demais!"
            : score >= 2
              ? "Quase! A sorte não ajudou dessa vez"
              : "Não foi dessa vez!"}
        </h2>
        <p className="mb-1 font-bold" style={{ color: restaurant.accent }}>
          Você acertou {score} de {TOTAL_QUESTIONS}
        </p>
        <p className="mb-6 text-sm text-white/70">
          {finalResult.won
            ? "Seu conhecimento gastronômico rendeu prêmio. Bom apetite!"
            : score >= 2
              ? "Você jogou muito — na próxima o prêmio vem!"
              : "Sem crise: agora você já sabe as respostas. Bora tentar de novo?"}
        </p>
        <button
          className="rounded-xl bg-brand-600 px-8 py-3 font-bold transition hover:bg-brand-500 active:scale-95"
          onClick={finish}
        >
          Ver resultado
        </button>
      </div>
    );
  }

  // Fases "question" e "feedback"
  const timePct = (timeLeft / TIME_PER_QUESTION) * 100;
  const urgent = timeLeft <= 5_000;

  return (
    <div className="p-4 text-white">
      {/* Progresso + placar */}
      <div className="mb-2 flex items-center justify-between text-xs font-bold text-white/70">
        <span>
          Pergunta {idx + 1} de {TOTAL_QUESTIONS}
        </span>
        <span>
          Acertos: <span style={{ color: restaurant.accent }}>{score}</span>
        </span>
      </div>

      {/* Barra de tempo */}
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-[width] duration-100 ease-linear ${
            urgent ? "bg-red-500" : "bg-brand-500"
          }`}
          style={{ width: `${timePct}%` }}
        />
      </div>

      {/* Pergunta */}
      <div
        className="mb-4 rounded-2xl border bg-white/5 p-4"
        style={{ borderColor: `${restaurant.accent}55` }}
      >
        <p className="font-bold leading-snug">{current.question}</p>
      </div>

      {/* Opções */}
      <div className="flex flex-col gap-2">
        {current.options.map((opt, i) => {
          const isCorrect = i === current.correct;
          const isPicked = selected === i;
          let cls =
            "rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-left text-sm font-semibold transition active:scale-[0.98]";
          if (phase === "feedback") {
            if (isCorrect) {
              cls =
                "rounded-xl border border-green-400 bg-green-500/25 px-4 py-3 text-left text-sm font-semibold";
            } else if (isPicked) {
              cls =
                "rounded-xl border border-red-400 bg-red-500/25 px-4 py-3 text-left text-sm font-semibold";
            } else {
              cls =
                "rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-semibold opacity-50";
            }
          }
          return (
            <button
              key={i}
              className={cls}
              disabled={phase === "feedback"}
              onClick={() => answer(i)}
            >
              <span className="mr-2 text-white/50">{String.fromCharCode(65 + i)}.</span>
              {opt}
              {phase === "feedback" && isCorrect && <span className="float-right">✅</span>}
              {phase === "feedback" && isPicked && !isCorrect && (
                <span className="float-right">❌</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback textual */}
      {phase === "feedback" && (
        <p className="mt-3 text-center text-sm font-bold">
          {selected === current.correct ? (
            <span className="text-green-400">Acertou! 🤩</span>
          ) : selected === null ? (
            <span className="text-red-400">Tempo esgotado! ⏰ A certa está em verde.</span>
          ) : (
            <span className="text-red-400">Opa, era a verde! 😅</span>
          )}
        </p>
      )}
    </div>
  );
}

export const quiz: GameDefinition = {
  id: "quiz",
  name: "Quiz Gastronômico",
  tagline: "Acerte e leve o prêmio",
  emoji: "🧠",
  component: Quiz,
};
