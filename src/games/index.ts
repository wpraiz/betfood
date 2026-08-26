import type { GameDefinition } from "../lib/types";
import { roleta } from "./roleta";
import { raspadinha } from "./raspadinha";
import { quiz } from "./quiz";
import { memoria } from "./memoria";

export const GAMES: GameDefinition[] = [roleta, raspadinha, quiz, memoria];

export function getGame(id: string): GameDefinition | undefined {
  return GAMES.find((g) => g.id === id);
}
