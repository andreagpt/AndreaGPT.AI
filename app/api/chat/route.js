import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const body = await req.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (!client.apiKey) {
      return new Response(
        JSON.stringify({
          error: "Falta la variable OPENAI_API_KEY en Vercel",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const reply = completion.choices[0]?.message ?? {
      role: "assistant",
      content: "No recibí respuesta del modelo.",
    };

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error en /api/chat:", error);
    return new Response(
      JSON.stringify({ error: "Error interno en /api/chat" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
