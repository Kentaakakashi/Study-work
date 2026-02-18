//joe if you're reading ts, istg you gotta fix that API issue in netlify brlther you fucked it up real good, and make sure to command out each block of code next time so its easy to find those block once again, you know the drill mf stop slacking

export default async (req) => {
  try {
    if (req.method !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    // auth presence check
    const auth = req.headers.get("authorization") || "";
    if (!auth.startsWith("Bearer ")) {
      return json(401, { error: "Missing auth token" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return json(500, { error: "Missing GEMINI_API_KEY env var on Netlify" });
    }

    const body = await req.json().catch(() => null);
    if (!body) return json(400, { error: "Invalid JSON" });

    const userText = (body.userText || "").toString().trim();
    const mode = (body.mode || "tutor").toString();
    const level = (body.level || "11").toString();
    const history = Array.isArray(body.history) ? body.history : [];

    if (!userText) return json(400, { error: "Empty message" });

    // Keep context small nd safe
    const safeHistory = history.slice(-12).map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: String(m.text || "").slice(0, 2000) }]
    }));

    // make it a study assistant
    const system = `
You are "Study Zone AI", a helpful study assistant for students.
Mode: ${mode}. Level: ${level}.
Rules:
- Be clear, step-by-step, and accurate.
- If user asks for answers, also teach how to solve.
- Keep it school-friendly and non-explicit.
- If unsure, say what you assume.
`;

    // Gemini REST endpoint (generateContent)
    const model = "gemini-2.5-flash"; // fast + cheap; change if you want
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const payload = {
      systemInstruction: { parts: [{ text: system.trim() }] },
      contents: [
        ...safeHistory,
        { role: "user", parts: [{ text: userText.slice(0, 8000) }] }
      ],
      generationConfig: {
        temperature: 0.6,
        topP: 0.9,
        maxOutputTokens: 800
      }
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return json(resp.status, {
        error: data?.error?.message || "Gemini request failed"
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") ||
      "No reply.";

    return json(200, { reply, model });
  } catch (e) {
    return json(500, { error: e?.message || "Server error" });
  }
};

function json(statusCode, obj) {
  return new Response(JSON.stringify(obj), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

