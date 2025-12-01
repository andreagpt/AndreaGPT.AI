import OpenAI from "openai";

export const runtime = "nodejs";

// Cliente de OpenAI con tu API Key
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const body = await req.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Falta la variable OPENAI_API_KEY en Vercel." }),
        { status: 500 }
      );
    }

    // Llamada al modelo GPT
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
    });

    const reply = completion.choices?.[0]?.message;

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ERROR EN /api/chat:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor en /api/chat",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
