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

==================== ✅ FORMATO DEAL CALCULATOR (OBLIGATORIO) ✅ ====================
Cuando el usuario te mande un link de Zillow O datos de una propiedad, responde SIEMPRE con:

1) **Resumen del Deal**
- Dirección (si la dieron)
- Estrategia sugerida: Buy & Hold / BRRRR / Airbnb / Fix & Flip (elige 1)
- Veredicto rápido: “ME GUSTA / NO ME GUSTA / DEPENDE” + 1 línea

2) **Inputs (lo que estoy usando)**
- Purchase Price
- Down Payment (% y $)
- Interest Rate
- Loan Term
- Closing Costs (estimado)
- Rehab (si aplica)
- Monthly Rent (o Rent Zestimate)
- Vacancy %
- Property Tax (mensual)
- Insurance (mensual)
- HOA (mensual)
- Maintenance %
- CapEx %
- Property Management %
- Utilities (si aplica)

3) **Resultados (Buy & Hold)**
- PITI (estimado)
- Total Monthly Expenses
- Monthly Cash Flow
- Cash-on-Cash Return (CoC)
- Cap Rate (si NO hay deuda, o indica “aprox”)
- Break-even occupancy (si aplica)

4) **Sensibilidad (ojo con esto)**
- Cash flow si renta baja -10%
- Cash flow si tasa sube +1%
- Punto mínimo de renta para quedar en $0 cash flow

5) **Recomendación de Andrea (pasos)**
- 3 próximos pasos concretos
- 3 preguntas que necesito para afinar (solo si faltan datos)

REGLAS:
- Si falta un número, NO lo inventes: usa rangos típicos PERO dilo CLARO como “Estimado”.
- Siempre etiqueta “Estimado” vs “Confirmado”.
====================================================================================

Listo. Comienza a responder como AndreaGPT.
`;
// ===============================================================

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function extractUrls(text = "") {
  const re = /(https?:\/\/[^\s]+)/g;
  return text.match(re) ?? [];
}

function isZillowUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname.includes("zillow.com");
  } catch {
    return false;
  }
}

function getTextFromMessage(msg) {
  if (!msg) return "";
  if (typeof msg.content === "string") return msg.content;
  // si viene en formato parts (por compatibilidad)
  if (Array.isArray(msg.parts)) {
    return msg.parts
      .filter((p) => p?.type === "text" && typeof p.text === "string")
      .map((p) => p.text)
      .join("\n");
  }
  return "";
}

export async function POST(req) {
  try {
    const body = await req.json();

    const userMessagesRaw = Array.isArray(body.messages)
      ? body.messages
      : body.message
        ? [body.message]
        : [];

    // Normalizamos a {role, content} string (evita errores raros)
    const userMessages = userMessagesRaw
      .map((m) => ({
        role: m?.role || "user",
        content: getTextFromMessage(m),
      }))
      .filter((m) => typeof m.content === "string");

    const lastUser = [...userMessages].reverse().find((m) => m.role === "user");
    const lastText = lastUser?.content ?? "";
    const urls = extractUrls(lastText);
    const zillowUrl = urls.find(isZillowUrl);

    // ✅ Si detecta Zillow, NO intentamos fetch. Solo pedimos inputs
    if (zillowUrl) {
      const replyText =
        `Muchacha, vi tu link de Zillow ✅\n` +
        `\n` +
        `Ojo con esto: Zillow casi siempre bloquea que yo “lea” la página automática (captcha). ` +
        `Pero igual te hago el **deal calculator** perfecto si me pegas estos numeritos.\n\n` +
        `**Del listing (copy/paste):**\n` +
        `1) Address\n` +
        `2) Precio\n` +
        `3) Beds / Baths / Sqft\n` +
        `4) Rent Zestimate (o renta esperada)\n` +
        `5) Taxes anual\n` +
        `6) HOA mensual (si aplica)\n` +
        `7) Condición / rehab (si el listing dice algo)\n\n` +
        `**Y dime tú:**\n` +
        `- Down payment % (20% o 25% si no sabes)\n` +
        `- Interest rate estimado (si no sabes, 7.5% por ahora)\n\n` +
        `En cuanto me lo pegues, te saco cash flow, CoC, cap rate y sensibilidad.`;

      return json({ reply: { role: "assistant", content: replyText } }, 200);
    }

    if (!client.apiKey) {
      return json({ error: "Falta la variable OPENAI_API_KEY en Vercel" }, 500);
    }

    const messages = [{ role: "system", content: systemPrompt }, ...userMessages];

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
    });

    const reply =
      completion.choices[0]?.message ?? {
        role: "assistant",
        content: "No recibí respuesta del modelo.",
      };

    return json({ reply }, 200);
  } catch (error) {
    console.error("ERROR EN /api/chat:", error);

    if (error?.status === 429 || String(error?.message || "").includes("quota")) {
      return json(
        {
          error:
            "Muchacha, OpenAI te está devolviendo 429 (sin cuota/billing). Revisa Billing y vuelve a probar.",
        },
        429
      );
    }

    return json({ error: "Error interno en /api/chat" }, 500);
  }
}
