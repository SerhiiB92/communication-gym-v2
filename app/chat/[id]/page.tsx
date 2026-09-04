"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getScenario } from "@/lib/scenarios";
import { ChatMessage } from "@/lib/types";

const MAX_MESSAGES = 20;

export default function ChatPage() {
    const params = useParams<{ id: string }>();
    const searchParams = useSearchParams();
    const router = useRouter();
    const scenario = getScenario(params.id);
    const level = Number(searchParams.get("level")) || 1;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isFinishing, setIsFinishing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const windowRef = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
    const baseTextRef = useRef("");

  useEffect(() => {
        if (windowRef.current) {
                windowRef.current.scrollTop = windowRef.current.scrollHeight;
        }
  }, [messages, isSending]);

  useEffect(() => {
        const SpeechRecognitionCtor =
                (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognitionCtor) return;
        setSpeechSupported(true);

                const recognition = new SpeechRecognitionCtor();
        recognition.lang = "uk-UA";
        recognition.continuous = true;
        recognition.interimResults = true;

                recognition.onresult = (event: any) => {
                        let finalText = "";
                        let interimText = "";
                        for (let i = event.resultIndex; i < event.results.length; i++) {
                                  const res = event.results[i];
                                  if (res.isFinal) {
                                              finalText += res[0].transcript;
                                  } else {
                                              interimText += res[0].transcript;
                                  }
                        }
                        if (finalText) {
                                  baseTextRef.current = `${baseTextRef.current}${finalText} `.replace(/\s+/g, " ");
                        }
                        setInput(`${baseTextRef.current}${interimText}`.trimStart());
                };

                recognition.onerror = () => {
                        setIsListening(false);
                };

                recognition.onend = () => {
                        setIsListening(false);
                };

                recognitionRef.current = recognition;

                return () => {
                        recognition.stop();
                };
        // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleListening() {
        const recognition = recognitionRef.current;
        if (!recognition) return;
        if (isListening) {
                recognition.stop();
                setIsListening(false);
        } else {
                baseTextRef.current = input ? `${input} ` : "";
                try {
                          recognition.start();
                          setIsListening(true);
                } catch {
                }
        }
  }

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
          if (isListening && recognitionRef.current) {
                  recognitionRef.current.stop();
                  setIsListening(false);
          }
          setError(null);
          setInput("");
          baseTextRef.current = "";
      
          const userMsg: ChatMessage = { role: "user", text };
          const newMessages = [...messages, userMsg];
          setMessages(newMessages);
          setIsSending(true);
      
          try {
                  const res = await fetch("/api/chat", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ scenarioId: sc.id, level, history: newMessages }),
                  });
                  const data = await res.json();
                  if (data.error) {
                            setError(data.error);
                            return;
                  }
                  const reply: ChatMessage = { role: "assistant", text: data.reply };
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
                  {messages.length === 0 && !isSending && (
                      <p className="loading-text">
                                  Почніть розмову першим повідомленням — опишіть ситуацію так, як зробили б у реальному
                                  житті.
                      </p>
                        )}
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
                                            placeholder="Напишіть своє повідомлення і натисніть Enter…"
                                            value={input}
                                            onChange={(e) => {
                                                            baseTextRef.current = e.target.value;
                                                            setInput(e.target.value);
                                            }}
                                            onKeyDown={onKeyDown}
                                            disabled={isSending || isFinishing}
                                            autoFocus
                                          />
                      {speechSupported && (
                                  <button
                                                  type="button"
                                                  className={`btn btn-secondary mic-btn ${isListening ? "mic-btn-active" : ""}`}
                                                  onClick={toggleListening}
                                                  disabled={isSending || isFinishing}
                                                  title={isListening ? "Зупинити диктування" : "Диктувати повідомлення голосом"}
                                                >
                                    {isListening ? "● Слухаю…" : "🎤"}
                                  </button>
                              )}
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
</div>
