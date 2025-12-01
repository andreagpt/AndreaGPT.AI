"use client";

import { useState } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const userMessage = { role: "user", content: text };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error en la API");
      }

      const replyMessage = data.reply ?? {};
      const content = replyMessage.content ?? "Sin respuesta del modelo.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content },
      ]);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem 1rem",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
        Chat con AndreaGPT.AI 💬
      </h1>

      <div
        style={{
          width: "100%",
          maxWidth: "700px",
          border: "1px solid #1f2937",
          borderRadius: "0.75rem",
          padding: "1rem",
          background: "#020617",
        }}
      >
        <div
          style={{
            maxHeight: "400px",
            overflowY: "auto",
            marginBottom: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                background:
                  m.role === "user" ? "#4f46e5" : "#111827",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.75rem",
                maxWidth: "80%",
                whiteSpace: "pre-wrap",
                fontSize: "0.9rem",
              }}
            >
              <strong>
                {m.role === "user" ? "Tú: " : "AndreaGPT.AI: "}
              </strong>
              {m.content}
            </div>
          ))}
          {isLoading && (
            <div
              style={{
                alignSelf: "flex-start",
                fontSize: "0.85rem",
                opacity: 0.8,
              }}
            >
              Pensando…
            </div>
          )}
        </div>

        {error && (
          <div
            style={{
              color: "#f97316",
              fontSize: "0.9rem",
              marginBottom: "0.5rem",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", gap: "0.5rem" }}
        >
          <input
            type="text"
            placeholder="Escribe tu pregunta aquí…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              flex: 1,
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid #374151",
              background: "#020617",
              color: "white",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "none",
              background: isLoading ? "#4b5563" : "#22c55e",
              color: "black",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {isLoading ? "Enviando..." : "Enviar"}
          </button>
        </form>
      </div>
    </main>
  );
}
