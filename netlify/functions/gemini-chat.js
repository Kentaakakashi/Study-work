export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return json(500, { error: "Missing GEMINI_API_KEY env var on Netlify" });
    }

    const body = JSON.parse(event.body || "{}");
    const userText = String(body.userText || "").trim();
    const mode = String(body.mode || "tutor");
    const level = String(body.level || "11");
    const history = Array.isArray(body.history) ? body.history : [];

    if (!userText) return json(400, { error: "Empty message" });

    const safeHistory = history.slice(-12).map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: String(m.text || "").slice(0, 2000) }]
    }));

    const system = `
You are "Study Zone AI", a helpful study assistant for students.
Mode: ${mode}. Level: ${level}.
Rules:
- Be clear, step-by-step, and accurate.
- If user asks for answers, also teach how to solve.
- Keep it school-friendly and non-explicit.
- If unsure, say what you assume.
`.trim();

    const model = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const payload = {
      systemInstruction: { parts: [{ text: system }] },
      contents: [
        ...safeHistory,
        { role: "user", parts: [{ text: userText.slice(0, 8000) }] }
      ],
      generationConfig: { temperature: 0.6, topP: 0.9, maxOutputTokens: 800 }
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return json(resp.status, { error: data?.error?.message || "Gemini request failed" });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "No reply.";

    return json(200, { reply, model });
  } catch (e) {
    return json(500, { error: e?.message || "Server error" });
  }
}

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  };
}
