import { NextRequest, NextResponse } from "next/server";
import { getScenario } from "@/lib/scenarios";
import { buildJudgePrompt } from "@/lib/judgePrompt";
import { generateJudgeReport } from "@/lib/llm";
import { ChatMessage } from "@/lib/types";

function extractJson(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced) return fenced[1].trim();
  return trimmed;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scenarioId, level, transcript } = body as {
      scenarioId: string;
      level: number;
      transcript: ChatMessage[];
    };

    const scenario = getScenario(scenarioId);
    if (!scenario) {
      return NextResponse.json({ error: "Сценарій не знайдено" }, { status: 404 });
    }
    if (!Array.isArray(transcript) || transcript.length === 0) {
      return NextResponse.json({ error: "Порожня стенограма розмови" }, { status: 400 });
    }

    const prompt = buildJudgePrompt(scenario, level, transcript);
    const raw = await generateJudgeReport(prompt);
    const cleaned = extractJson(raw);

    try {
      const parsed = JSON.parse(cleaned);
      return NextResponse.json(parsed);
    } catch {
      console.error("judge JSON parse failed, raw response:", raw);
      return NextResponse.json(
        { error: "Не вдалося розібрати відповідь оцінювача. Спробуйте завершити розмову ще раз." },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("judge API error:", err);
    return NextResponse.json({ error: "Помилка сервера під час оцінювання" }, { status: 500 });
  }
}
