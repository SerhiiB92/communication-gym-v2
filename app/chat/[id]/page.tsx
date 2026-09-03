"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getScenario } from "@/lib/scenarios";
import { BOOTSTRAP_TRIGGER } from "@/lib/promptBuilder";
import { ChatMessage } from "@/lib/types";

const MAX_MESSAGES = 20;

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const scenario = getScenario(params.id);
  const level = Number(searchParams.get("level")) || 1;

  // apiHistory включає приховане стартове повідомлення, messages — лише видимі репліки
  const [apiHistory, setApiHistory] = useState<ChatMessage[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (windowRef.current) {
      windowRef.current.scrollTop = windowRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  useEffect(() => {
    if (!scenario || startedRef.current) return;
    startedRef.current = true;
    const bootstrapHistory: ChatMessage[] = [{ role: "user", text: BOOTSTRAP_TRIGGER }];
    setIsSending(true);
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenarioId: scenario.id, level, history: bootstrapHistory }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        const reply: ChatMessage = { role: "assistant", text: data.reply };
        setApiHistory([...bootstrapHistory, reply]);
        setMessages([reply]);
      })
      .catch(() => setError("Не вдалося зв'язатися з сервером."))
      .finally(() => setIsSending(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario?.id]);

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

  const sc = scenario;
  const totalTurns = messages.length;
  const reachedLimit = totalTurns >= MAX_MESSAGES;
  const hasUserReply = messages.some((m) => m.role === "user");

  async function sendMessage() {
    const text = input.trim();
    if (!text || isSending || reachedLimit) return;
    setError(null);
    setInput("");

    const userMsg: ChatMessage = { role: "user", text };
    const newApiHistory = [...apiHistory, userMsg];
    const newMessages = [...messages, userMsg];
    setApiHistory(newApiHistory);
    setMessages(newMessages);
    setIsSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: sc.id, level, history: newApiHistory }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      const reply: ChatMessage = { role: "assistant", text: data.reply };
      setApiHistory([...newApiHistory, reply]);
      setMessages([...newMessages, reply]);
    } catch {
      setError("Не вдалося зв'язатися з сервером.");
    } finally {
      setIsSending(false);
    }
  }

  async function finishConversation() {
    if (isFinishing || !hasUserReply) return;
    setIsFinishing(true);
    setError(null);
    try {
      const res = await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: sc.id, level, transcript: messages }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setIsFinishing(false);
        return;
      }
      sessionStorage.setItem(
        "commtrainer_result",
        JSON.stringify({ scenario: sc, level, transcript: messages, result: data })
      );
      router.push("/result");
    } catch {
      setError("Не вдалося отримати оцінку. Спробуйте ще раз.");
      setIsFinishing(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="container">
      <Link href={`/scenario/${sc.id}`} className="back-link">
        ← Назад до сценарію
      </Link>

      <div className="chat-header">
        <h1 className="chat-header-title">{sc.titleUa}</h1>
        <span className="chat-header-meta">
          Рівень {level} · Репліка {totalTurns}/{MAX_MESSAGES}
        </span>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="chat-window" ref={windowRef}>
        {messages.map((m, i) => (
          <div key={i} className={`bubble-row ${m.role}`}>
            <div className={`bubble ${m.role}`}>{m.text}</div>
          </div>
        ))}
        {isSending && (
          <div className="bubble-row assistant">
            <div className="bubble assistant typing">Співрозмовник друкує…</div>
          </div>
        )}
      </div>

      {reachedLimit ? (
        <p className="loading-text">Ліміт реплік для цього сценарію досягнуто — завершіть розмову.</p>
      ) : (
        <div className="chat-input-row">
          <textarea
            placeholder="Напишіть свою відповідь і натисніть Enter…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={isSending || isFinishing}
          />
          <button className="btn" onClick={sendMessage} disabled={isSending || isFinishing || !input.trim()}>
            Надіслати
          </button>
        </div>
      )}

      <div className="chat-footer-row">
        <span className="loading-text">
          {hasUserReply ? "Можете завершити розмову в будь-який момент" : "Напишіть першу репліку"}
        </span>
        <button
          className="btn btn-secondary"
          onClick={finishConversation}
          disabled={!hasUserReply || isFinishing || isSending}
        >
          {isFinishing ? "Оцінюємо…" : "Завершити розмову"}
        </button>
      </div>
    </div>
  );
}
