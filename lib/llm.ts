import { ChatMessage } from "./types";

// Провайдер: Groq (безкоштовний тариф, без прив'язки картки, OpenAI-сумісний API).
// Отримати ключ: https://console.groq.com/keys

const apiKey = process.env.GROQ_API_KEY;
const modelName = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callGroq(messages: GroqMessage[]): Promise<string> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages,
      temperature: 0.8,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Groq API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("Groq API: неочікуваний формат відповіді");
  }
  return content;
}

export async function generateCharacterReply(
  systemPrompt: string,
  history: ChatMessage[]
): Promise<string> {
  if (!apiKey) {
    return "[DEV MODE] GROQ_API_KEY не задано в .env.local — це заглушка відповіді персонажа. Додайте безкоштовний ключ з console.groq.com/keys, щоб отримувати реальні відповіді.";
  }
  const messages: GroqMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.map((h) => ({
      role: (h.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
      content: h.text,
    })),
  ];
  return callGroq(messages);
}

export async function generateJudgeReport(prompt: string): Promise<string> {
  if (!apiKey) {
    return JSON.stringify({
      scores: {
        clarity: 60,
        empathy: 60,
        listening: 60,
        facts: 60,
        ownership: 60,
        psychSafety: 60,
      },
      whatWentWell: ["[DEV MODE] Додайте GROQ_API_KEY в .env.local, щоб отримати реальну оцінку."],
      whatToImprove: ["[DEV MODE] Це заглушка, а не справжній аналіз розмови."],
      practicalTips: ["[DEV MODE] Отримайте безкоштовний ключ на https://console.groq.com/keys"],
    });
  }
  return callGroq([{ role: "user", content: prompt }]);
}
