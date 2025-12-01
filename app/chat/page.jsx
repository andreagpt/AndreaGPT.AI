"use client";

import { useState } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];

    // Pintamos el mensaje del usuario
    setMessages(newMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) {
        let data = {};
        try {
          data = await res.json();
        } catch (_) {}
        throw new Error(data.error || "Error en la API de AndreaGPT.AI");
      }

      const data = await res.json();
      const reply = data.reply || data;

      const assistantMessage = {
        role: reply.role || "assistant",
        content: Array.isArray(reply.content)
          ? reply.content
              .map((part) =>
                typeof part === "string"
                  ? part
                  : part.text || part.content || ""
              )
              .join(" ")
          : reply.content,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error desconocido hablando con AndreaGPT.AI");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#020617",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "1.5rem",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
        Chat con AndreaGPT.AI 💬
      </h1>

      <div
        style={{
          width: "100%",
          maxWidth: "700px",
          display: "flex",
          flexDirection: "column",
          border: "1px solid #27272a",
          borderRadius: "0.75rem",
          padding: "1rem",
          backgroundColor: "#020617",
          gap: "0.75rem",
        }}
      >
        <div
          style={{
            flex: 1,
            maxHeight: "60vh",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            fontSize: "0.9rem",
          }}
        >
          {messages.length === 0 && (
            <p style={{ color: "#a1a1aa" }}>
              Escribe tu primera pregunta abajo. Por ejemplo:{" "}
              <strong>"¿Cómo empiezo a invertir en real estate?"</strong>
            </p>
          )}

          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "80%",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.75rem",
                  backgroundColor:
                    m.role === "user" ? "#db2777" : "#18181b",
                  color: "white",
                  whiteSpace: "pre-wrap",
                }}
              >
                <div
                  style={{
                    fontSize: "0.7rem",
                    opacity: 0.7,
                    marginBottom: "0.2rem",
                  }}
                >
                  {m.role === "user" ? "Tú" : "AndreaGPT.AI"}
                </div>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <p style={{ color: "#a1a1aa" }}>AndreaGPT.AI está pensando… 💭</p>
          )}

          {error && (
            <p style={{ color: "#f97373", fontSize: "0.8rem" }}>⚠️ {error}</p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta aquí…"
            style={{
              flex: 1,
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid #27272a",
              backgroundColor: "#020617",
              color: "white",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "none",
              backgroundColor: loading || !input.trim() ? "#52525b" : "#db2777",
              color: "white",
              fontWeight: 600,
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "Enviando…" : "Enviar"}
          </button>
        </form>
      </div>
    </main>
  );
}
