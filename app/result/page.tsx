"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { rubric } from "@/lib/rubric";
import { JudgeResult, Scenario } from "@/lib/types";

interface StoredResult {
  scenario: Scenario;
  level: number;
  result: JudgeResult;
}

export default function ResultPage() {
  const [data, setData] = useState<StoredResult | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("commtrainer_result");
    if (!raw) {
      setNotFound(true);
      return;
    }
    try {
      setData(JSON.parse(raw));
    } catch {
      setNotFound(true);
    }
  }, []);

  if (notFound) {
    return (
      <div className="container">
        <p>Немає збережених результатів. Схоже, ви відкрили цю сторінку напряму.</p>
        <Link href="/" className="back-link">
          ← До списку сценаріїв
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container">
        <p className="loading-text">Завантаження результату…</p>
      </div>
    );
  }

  const { scenario, level, result } = data;
  const avg =
    Math.round(
      (Object.values(result.scores).reduce((a, b) => a + b, 0) / Object.values(result.scores).length) * 10
    ) / 10;

  return (
    <div className="container">
      <Link href="/" className="back-link">
        ← До списку сценаріїв
      </Link>
      <h1 className="page-title">Результат: {scenario.titleUa}</h1>
      <p className="page-subtitle">
        Рівень складності {level} · Середній бал {avg}%
      </p>

      <div className="report-section">
        <h3>Оцінка за критеріями</h3>
        {rubric.map((c) => {
          const value = result.scores[c.key] ?? 0;
          return (
            <div className="score-row" key={c.key}>
              <div className="score-row-top">
                <span>{c.labelUa}</span>
                <strong>{value}%</strong>
              </div>
              <div className="score-bar-bg">
                <div className="score-bar-fill" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="report-section">
        <h3>Що вийшло добре</h3>
        <ul>
          {result.whatWentWell.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="report-section">
        <h3>Що варто покращити</h3>
        <ul>
          {result.whatToImprove.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="report-section">
        <h3>Практичні поради</h3>
        <ul>
          {result.practicalTips.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="result-actions">
        <Link href={`/scenario/${scenario.id}`} className="btn btn-secondary">
          Спробувати цей сценарій ще раз
        </Link>
        <Link href="/" className="btn">
          До наступного сценарію
        </Link>
      </div>
    </div>
  );
}
