import { NextRequest, NextResponse } from "next/server";
import { getScenario } from "@/lib/scenarios";
import { buildCharacterSystemPrompt } from "@/lib/promptBuilder";
import { generateCharacterReply } from "@/lib/llm";
import { ChatMessage } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scenarioId, level, history } = body as {
      scenarioId: string;
      level: number;
      history: ChatMessage[];
    };

    const scenario = getScenario(scenarioId);
    if (!scenario) {
      return NextResponse.json({ error: "Сценарій не знайдено" }, { status: 404 });
    }
    if (![1, 2, 3].includes(level)) {
      return NextResponse.json({ error: "Некоректний рівень складності" }, { status: 400 });
    }
    if (!Array.isArray(history) || history.length === 0) {
      return NextResponse.json({ error: "Порожня історія діалогу" }, { status: 400 });
    }

    const systemPrompt = buildCharacterSystemPrompt(scenario, level);
    const reply = await generateCharacterReply(systemPrompt, history);

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("chat API error:", err);
    return NextResponse.json({ error: "Помилка сервера під час генерації відповіді" }, { status: 500 });
  }
}
