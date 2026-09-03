export type Category = "team" | "clients" | "stakeholders" | "freelance";

export interface Scenario {
  id: string;
  category: Category;
  titleUa: string;
  shortUa: string;
  contextUa: string;
  goalUa: string;
  // Внутрішні поля для промпту персонажа — можуть залишатись росс./укр. мовою нотаток,
  // модель все одно відповідає українською за інструкцією в системному промпті.
  characterNotes: string;
  objectionsPool: string[];
  hiddenMotive: string;
  escalationUp: string;
  escalationDown: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export type RubricKey =
  | "clarity"
  | "empathy"
  | "listening"
  | "facts"
  | "ownership"
  | "psychSafety";

export interface JudgeResult {
  scores: Record<RubricKey, number>;
  whatWentWell: string[];
  whatToImprove: string[];
  practicalTips: string[];
}
