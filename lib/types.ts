export type Category = "team" | "clients" | "stakeholders" | "freelance";

export interface Scenario {
    id: string;
    category: Category;
    titleUa: string;
    shortUa: string;
    contextUa: string;
    goalUa: string;
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

export interface ExampleDialogueLine {
    role: "manager" | "character";
    text: string;
}

export interface JudgeResult {
    scores: Record<RubricKey, number>;
    whatWentWell: string[];
    whatToImprove: string[];
    practicalTips: string[];
    exampleDialogue: ExampleDialogueLine[];
}
