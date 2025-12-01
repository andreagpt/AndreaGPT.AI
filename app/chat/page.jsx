"use client";
import { useState } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  async function sendMessage() {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);

    setInput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages }),
    });

    const data = await res.json();

    if (data.reply) {
      setMessages([...newMessages, data.reply]);
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 700, margin: "0 auto" }}>
      <h1>AndreaGPT Chat 🤖✨</h1>

      <div
        style={{
          border: "1px solid white",
          padding: 20,
          height: "60vh",
          overflowY: "auto",
          marginBottom: 20,
        }}
      >
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <strong>{msg.role === "user" ? "Tú" : "AndreaGPT"}:</strong>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <input
          style={{ flex: 1, padding: 10, color: "black" }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu mensaje..."
        />
        <button
          onClick={sendMessage}
          style={{
            padding: "10px 20px",
            background: "purple",
            border: "none",
            cursor: "pointer",
            color: "white",
          }}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
