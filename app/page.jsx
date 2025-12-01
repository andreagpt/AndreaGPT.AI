"use client";

import { useState } from "react";

export default function HomePage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hola, soy AndreaGPT. ¿En qué te ayudo hoy?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const newMessages = [
      ...messages,
      { role: "user", content: input.trim() },
    ];

    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}`);
      }

      const data = await res.json();
      const replyContent =
        data.reply?.content ?? "Ups, algo salió mal hablando con el modelo.";

      setMessages([
        ...newMessages,
        { role: "assistant", content: replyContent },
      ]);
    } catch (err) {
      console.error(err);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            "No pude hablar con el modelo ahora mismo. Revisa tu OPENAI_API_KEY en Vercel.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main>
      <div className="chat-container">
        <h1 className="chat-title">AndreaGPT.AI</h1>

        <div className="messages">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`message ${m.role === "user" ? "user" : "assistant"}`}
            >
              {m.content}
            </div>
          ))}
          {isLoading && (
            <div className="message assistant">
              AndreaGPT está respondiendo…
            </div>
          )}
        </div>

        <form className="input-row" onSubmit={handleSubmit}>
          <input
            placeholder="Escribe tu mensaje…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" disabled={!input.trim() || isLoading}>
            Enviar
          </button>
        </form>
      </div>
    </main>
  );
}
