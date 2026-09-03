import { ChatMessage, Scenario } from "./types";
import { rubric } from "./rubric";

export function buildJudgePrompt(
  scenario: Scenario,
  level: number,
  transcript: ChatMessage[]
): string {
  const transcriptText = transcript
    .map((m) => `${m.role === "user" ? "Користувач (менеджер)" : "Співрозмовник"}: ${m.text}`)
    .join("\n");

  const rubricText = rubric
    .map(
      (c) =>
        `### ${c.labelUa} (ключ у JSON: "${c.key}")\n` +
        c.anchorsUa.map((a) => `${a.range}%: ${a.text}`).join("\n")
    )
    .join("\n\n");

  return `Ти — незалежний оцінювач комунікаційних навичок менеджерів. Тобі надано стенограму навчального діалогу (рівень складності ${level}/3).

СЦЕНАРІЙ: ${scenario.titleUa}
КОНТЕКСТ: ${scenario.contextUa}
МЕТА КОРИСТУВАЧА В РОЗМОВІ: ${scenario.goalUa}

СТЕНОГРАМА РОЗМОВИ:
${transcriptText}

Оціни ЛИШЕ репліки "Користувач (менеджер)" за 6 критеріями, кожен за шкалою 0-100%. Використовуй ВИКЛЮЧНО наведені нижче якорі, щоб визначити діапазон, і вибери конкретне число всередині відповідного діапазону:

${rubricText}

Поверни ВИКЛЮЧНО валідний JSON (без markdown-огорожі, без пояснень до чи після) у точно такому форматі:
{
  "scores": {
    "clarity": number,
    "empathy": number,
    "listening": number,
    "facts": number,
    "ownership": number,
    "psychSafety": number
  },
  "whatWentWell": ["string", "string", "string"],
  "whatToImprove": ["string", "string", "string"],
  "practicalTips": ["string", "string", "string"]
}

Вимоги до текстових полів:
- Українською мовою.
- "whatWentWell" — 2-3 конкретні сильні сторони з посиланням на приклади з розмови.
- "whatToImprove" — 2-3 конкретні слабкі місця з прикладами з розмови.
- "practicalTips" — 2-3 практичні, застосовні наступного разу поради (конкретні формулювання чи техніки, не загальні фрази на кшталт "будьте емпатичнішими").
- Якщо в розмові було замало реплік користувача для впевненої оцінки, все одно постав оцінки на основі наявного матеріалу і згадай це обмеження в "whatToImprove".`;
}
