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
- 3 próximos pasos concretos (por ejemplo: pedir seller disclosures, rent comps, taxes exactos, insurance quote)
- 3 preguntas que necesito para afinar (solo si faltan datos)

REGLAS:
- Si falta un número, NO lo inventes: usa rangos típicos PERO dilo CLARO como “Estimado”.
- Siempre etiqueta “Estimado” vs “Confirmado”.
====================================================================================

Listo. Comienza a responder como AndreaGPT.
`;
// ===============================================================

// ---------- Zillow helpers (best effort) ----------
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

async function fetchZillowHtmlBestEffort(url) {
  // Zillow suele bloquear bots. Esto es best-effort.
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });

  if (!res.ok) return { ok: false, status: res.status, html: "" };

  const html = await res.text();
  const snippet = html.slice(0, 12000);

  const looksBlocked =
    /captcha|px-captcha|access denied|blocked|robot|unusual traffic/i.test(
      snippet
    );

  if (looksBlocked) return { ok: false, status: 403, html: "" };

  return { ok: true, status: res.status, html: snippet };
}
// -----------------------------------------------

function json(resBody, status = 200) {
  return new Response(JSON.stringify(resBody), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req) {
  try {
    const body = await req.json();

    // Aceptamos:
    // - body.messages (array)  ✅ recomendado
    // - o el formato viejo { message } (por si acaso)
    const userMessages = Array.isArray(body.messages)
      ? body.messages
      : body.message
        ? [body.message]
        : [];

    // Detectar Zillow link en el último mensaje del usuario (si existe)
    const lastUser = [...userMessages].reverse().find((m) => m?.role === "user");
    const lastText =
      typeof lastUser?.content === "string" ? lastUser.content : "";
    const urls = extractUrls(lastText);
    const zillowUrl = urls.find(isZillowUrl);

    // Si hay Zillow URL, intentamos traer HTML para contexto
    let zillowContext = "";
    if (zillowUrl) {
      try {
        const fetched = await fetchZillowHtmlBestEffort(zillowUrl);

        if (fetched.ok) {
          zillowContext =
            `\n\n[ZILLOW_LISTING_HTML_SNIPPET_BEGIN]\n` +
            fetched.html +
            `\n[ZILLOW_LISTING_HTML_SNIPPET_END]\n`;
        } else {
          // Zillow bloquea muy seguido: pedimos inputs mínimos
          const replyText =
            `Muchacha, vi tu link de Zillow ✅\n\n` +
            `PERO Zillow a veces bloquea que yo lo “importe” automático.\n` +
            `Para sacarte el **deal calculator** ya mismo, pégame estos datos (copy/paste del listing):\n\n` +
            `**Confirmado (del listing):**\n` +
            `1) Address\n` +
            `2) Precio\n` +
            `3) Beds/Baths/Sqft\n` +
            `4) Rent Zestimate (o renta esperada)\n` +
            `5) Taxes anual\n` +
            `6) HOA mensual (si aplica)\n` +
            `7) Condición / rehab (si el listing dice algo)\n\n` +
            `**Y dime esto tú:**\n` +
            `- ¿Down payment %? (si no sabes, dime 20% o 25%)\n` +
            `- ¿Interest rate estimado? (si no sabes, dime 7.5% por ahora)\n\n` +
            `Ojo con esto: en cuanto me pegues eso, te lo saco con cash flow, CoC, cap rate y sensibilidad.`;

          return json({ reply: { role: "assistant", content: replyText } }, 200);
        }
      } catch (_e) {
        const replyText =
          `Muchacha, vi tu link de Zillow ✅\n\n` +
          `Pero no pude importarlo automático (Zillow se pone intenso).\n` +
          `Pégame estos datos y te saco el **deal calculator**:\n\n` +
          `1) Address\n2) Precio\n3) Beds/Baths/Sqft\n4) Rent Zestimate\n5) Taxes anual\n6) HOA mensual\n7) Rehab/condición\n\n` +
          `+ Down payment % y tasa estimada.`;

        return json({ reply: { role: "assistant", content: replyText } }, 200);
      }
    }

    // Armamos mensajes para el modelo
    const messages = [
      { role: "system", content: systemPrompt },
      ...userMessages,
    ];

    // Si sí pudimos traer HTML, lo metemos como contexto extra (sin inventar datos)
    if (zillowContext) {
      messages.push({
        role: "system",
        content:
          "Contexto extra del listing (best effort). Úsalo solo si aporta. " +
          "NO inventes números. Si un dato no está claro, pídeselo al usuario." +
          zillowContext,
      });
    }

    // Validación mínima
    if (!client.apiKey) {
      return json(
        { error: "Falta la variable OPENAI_API_KEY en Vercel" },
        500
      );
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
    });

    const reply = completion.choices[0]?.message ?? {
      role: "assistant",
      content: "No recibí respuesta del modelo.",
    };

    return json({ reply }, 200);
  } catch (error) {
    console.error("ERROR EN /api/chat:", error);

    // Manejo especial de quota (429)
    const maybeStatus = error?.status || error?.code;
    if (maybeStatus === 429 || error?.message?.includes("insufficient_quota")) {
      return json(
        {
          error:
            "Muchacha, tu cuenta de OpenAI está sin cuota/billing ahora mismo (429). Revisa Billing en OpenAI y vuelve a probar.",
        },
        429
      );
    }

    return json({ error: "Error interno en /api/chat" }, 500);
  }
}
