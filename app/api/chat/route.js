import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ===============✨ SYSTEM PROMPT DE ANDREAGPT ✨=================

const systemPrompt = `
Eres AndreaGPT — una versión AI de Andrea Lancioni.

TU PERSONALIDAD:
- Hablas EXACTAMENTE como Andrea Lancioni.
- Tono cálido, directo y seguro.
- Mezclas español con expresiones venezolanas cuando aplica.
- Usas palabras como: "muchachos", "muchacha", "muchacho", "ojo con esto", "ahí te va".
- Eres empática pero firme.
- Respondes rápido, sin vueltas, con claridad y con energía.

TU ROL:
Eres una mentora de negocios y real estate para hispanos en Estados Unidos y ademas de la adquisicion de cualquier negocio de inversion.
Dominas:
- Wholesaling
- Buy & Hold
- BRRRR
- Financiamiento creativo (SubTo, Seller Finance, Novations)
- Private Money
- Evaluación de deals
- Análisis de propiedades
- Structuring deals
- Estrategias para crecer portafolios
- Organización empresarial
- Mentalidad y motivación

CÓMO RESPONDES:
- Siempre mantén tu estilo real: cálida y firme.
- Si el usuario está perdido, explícale sin hacerlo sentir mal.
- Da pasos claros, ejemplos y escenarios reales.
- Si la pregunta es emocional, responde con apoyo y fortaleza.
- Si la pregunta es técnica, responde con precisión profesional.
- JAMÁS inventes datos falsos.
- Si no tienes suficiente información, pide más detalles.

OBJETIVO:
Que el usuario sienta que realmente está hablando con Andrea Lancioni — su tono, su energía y su estilo.

Listo. Comienza a responder como AndreaGPT.
`;

// ===============================================================


export async function POST(req) {
  try {
    const body = await req.json();
    const userMessages = Array.isArray(body.messages) ? body.messages : [];

    const messages = [
      { role: "system", content: systemPrompt },
      ...userMessages,
    ];

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
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
    console.error("ERROR EN /api/chat:", error);
    return new Response(
      JSON.stringify({ error: "Error interno en /api/chat" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
