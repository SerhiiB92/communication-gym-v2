"use client";

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getScenario } from "@/lib/scenarios";

const LEVELS = [
  { level: 1, label: "Рівень 1", desc: "Легко" },
  { level: 2, label: "Рівень 2", desc: "Середньо" },
  { level: 3, label: "Рівень 3", desc: "Складно" },
];

export default function ScenarioPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const scenario = getScenario(params.id);

  if (!scenario) {
    return (
      <div className="container">
        <p>Сценарій не знайдено.</p>
        <Link href="/" className="back-link">
          ← До списку сценаріїв
        </Link>
      </div>
    );
  }

  return (
    <div className="container">
      <Link href="/" className="back-link">
        ← До списку сценаріїв
      </Link>
      <h1 className="page-title">{scenario.titleUa}</h1>

      <div className="brief-box">
        <h2>Ситуація</h2>
        <p>{scenario.contextUa}</p>
        <h2>Ваша мета в розмові</h2>
        <p>{scenario.goalUa}</p>
      </div>

      <div className="category-heading">Оберіть рівень складності</div>
      <div className="level-grid">
        {LEVELS.map((l) => (
          <button
            key={l.level}
            className="level-btn"
            onClick={() => router.push(`/chat/${scenario.id}?level=${l.level}`)}
          >
            {l.label}
            <small>{l.desc}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
