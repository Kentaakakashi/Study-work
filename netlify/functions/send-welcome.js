function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM;

    if (!apiKey || !from) {
      return json(500, {
        error: "Missing RESEND_API_KEY or RESEND_FROM env vars on Netlify",
      });
    }

    const { to, name } = JSON.parse(event.body || "{}");
    if (!to) return json(400, { error: "Missing 'to' email" });

    const safeName = (name || "there").toString().trim() || "there";

    const subject = "Welcome to Study Zen ✨";
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="margin:0 0 12px;">
          Welcome to <span style="color:#14b8a6;">Study Zen</span> ✨
        </h2>
        <p style="margin:0 0 12px;">Hey ${safeName},</p>
        <p style="margin:0 0 12px;">
          Your account is ready. Study Zen is built to help you focus, plan sessions,
          track progress, and keep your workflow clean.
        </p>
        <p style="margin:16px 0 0;">
          <a href="https://study-zen.netlify.app"
             style="display:inline-block;padding:12px 18px;background:#14b8a6;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;">
            Open Study Zen
          </a>
        </p>
        <p style="margin:18px 0 0;color:#666;font-size:12px;">
          If this wasn’t you, secure your account immediately.
        </p>
      </div>
    `;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      return json(500, { error: "Resend failed", details: data });
    }

    return json(200, { ok: true, id: data?.id || null });
  } catch (e) {
    return json(500, { error: e?.message || "Unknown error" });
  }
}
