import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const body = await req.json();

    // Acepta body.messages o body.message (un string)
    let messages = [];

    if (Array.isArray(body.messages)) {
      messages = body.messages;
    } else if (typeof body.message === "string") {
      messages = [{ role: "user", content: body.message }];
    }

    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Falta la variable OPENAI_API_KEY en Vercel" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!messages.length) {
      return new Response(
        JSON.stringify({ error: "No se enviaron mensajes al modelo" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
    });

    const reply = completion.choices?.[0]?.message ?? {
      role: "assistant",
      content: "No recibí respuesta del modelo.",
    };

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ERROR EN /api/chat:", error);

    return new Response(
      JSON.stringify({
        error: "Error interno en /api/chat",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
