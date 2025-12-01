export default function Home() {
  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h1>AndreaGPT AI</h1>
      <p>Tu chatbot ya está conectado. Prueba enviando un mensaje:</p>

      <form action="/api/chat" method="POST">
        <textarea
          name="messages"
          placeholder="Escribe tu mensaje para AndreaGPT..."
          rows={5}
          style={{ width: "100%", padding: "10px", marginTop: "10px" }}
        ></textarea>

        <button
          type="submit"
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            background: "black",
            color: "white",
          }}
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
