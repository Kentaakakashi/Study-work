function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM;

    // Optional: set these in Netlify env vars for branding
    const logoUrl = (process.env.STUDYZEN_LOGO_URL || "").trim();
    const bannerUrl = (process.env.STUDYZEN_BANNER_URL || "").trim();

    if (!apiKey || !from) {
      return json(500, {
        error: "Missing RESEND_API_KEY or RESEND_FROM env vars on Netlify",
      });
    }

    const { to, name } = JSON.parse(event.body || "{}");
    if (!to) return json(400, { error: "Missing 'to' email" });

    const safeNameRaw = (name || "there").toString().trim() || "there";
    const safeName = escapeHtml(safeNameRaw);

    const appUrl = "https://study-zen.netlify.app";
    const subject = "Welcome to Study Zen ✨";

    // Plain-text fallback (helps with spam/inbox placement)
    const text =
      `Welcome to Study Zen ✨\n\n` +
      `Hey ${safeNameRaw},\n\n` +
      `Your account is ready. Study Zen is built to help you focus, plan sessions, track progress, and keep your workflow clean.\n\n` +
      `Open Study Zen: ${appUrl}\n\n` +
      `If this wasn’t you, secure your account immediately.`;

    const bannerBlock = bannerUrl
      ? `
        <tr>
          <td style="background:#0b1220;">
            <img
              src="${escapeHtml(bannerUrl)}"
              width="600"
              alt="Study Zen"
              style="display:block;width:100%;max-width:600px;height:auto;"
            />
          </td>
        </tr>
      `
      : "";

    const logoBlock = logoUrl
      ? `
        <img
          src="${escapeHtml(logoUrl)}"
          width="38"
          height="38"
          alt="Study Zen Logo"
          style="display:block;border-radius:10px;border:1px solid rgba(255,255,255,0.12);"
        />
      `
      : `
        <div
          style="width:38px;height:38px;border-radius:10px;background:rgba(20,184,166,0.14);
                 border:1px solid rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;
                 font-weight:800;color:#99fff2;font-family:Arial,system-ui,-apple-system,Segoe UI,sans-serif;">
          SZ
        </div>
      `;

    const html = `
<div style="margin:0;padding:0;background:#0b1220;">
  <!-- Preheader (hidden but shows in inbox preview) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    Welcome to Study Zen. Your account is ready. Focus • Plan • Grow.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b1220;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
          
          ${bannerBlock}

          <tr>
            <td style="background:linear-gradient(180deg,#0b1220 0%,#070b14 100%);padding:22px 22px 18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:10px;vertical-align:middle;">
                          ${logoBlock}
                        </td>
                        <td style="vertical-align:middle;">
                          <div style="font-family:Arial,system-ui,-apple-system,Segoe UI,sans-serif;font-size:16px;font-weight:900;color:#eaf2ff;line-height:1.2;">
                            Study Zen
                          </div>
                          <div style="font-family:Arial,system-ui,-apple-system,Segoe UI,sans-serif;font-size:12px;color:rgba(234,242,255,0.65);margin-top:2px;">
                            Focus • Plan • Grow
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="font-family:Arial,system-ui,-apple-system,Segoe UI,sans-serif;font-size:12px;color:rgba(234,242,255,0.55);">
                      Account ready ✅
                    </span>
                  </td>
                </tr>
              </table>

              <div style="height:14px;"></div>

              <div style="font-family:Arial,system-ui,-apple-system,Segoe UI,sans-serif;color:#eaf2ff;">
                <div style="font-size:20px;font-weight:900;letter-spacing:-0.3px;margin:0 0 10px;">
                  Welcome, ${safeName} ✨
                </div>

                <div style="font-size:14px;line-height:1.65;color:rgba(234,242,255,0.78);margin:0 0 14px;">
                  Your account is ready. Study Zen helps you run focused sessions, track progress, and keep your workflow clean.
                </div>

                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
                  <tr>
                    <td style="padding:0 8px 8px 0;">
                      <span style="display:inline-block;padding:8px 10px;border-radius:999px;background:rgba(20,184,166,0.12);border:1px solid rgba(20,184,166,0.22);color:#99fff2;font-size:12px;">
                        ⏱ Focus sessions
                      </span>
                    </td>
                    <td style="padding:0 8px 8px 0;">
                      <span style="display:inline-block;padding:8px 10px;border-radius:999px;background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.22);color:#c8cbff;font-size:12px;">
                        📈 Stats & streaks
                      </span>
                    </td>
                    <td style="padding:0 0 8px 0;">
                      <span style="display:inline-block;padding:8px 10px;border-radius:999px;background:rgba(244,63,94,0.10);border:1px solid rgba(244,63,94,0.20);color:#ffc0cd;font-size:12px;">
                        🤝 Community
                      </span>
                    </td>
                  </tr>
                </table>

                <div style="margin:0 0 10px;">
                  <a href="${appUrl}"
                     style="display:inline-block;padding:12px 16px;border-radius:12px;background:#14b8a6;color:#041016;text-decoration:none;font-weight:900;font-size:14px;">
                    Open Study Zen
                  </a>
                </div>

                <div style="font-size:12px;color:rgba(234,242,255,0.55);line-height:1.6;">
                  If that button doesn’t work, copy this link:<br/>
                  <span style="color:rgba(234,242,255,0.78);">${appUrl}</span>
                </div>
              </div>

              <div style="height:18px;"></div>
              <div style="border-top:1px solid rgba(255,255,255,0.10);padding-top:12px;
                          font-family:Arial,system-ui,-apple-system,Segoe UI,sans-serif;font-size:12px;color:rgba(234,242,255,0.55);line-height:1.6;">
                If this wasn’t you, secure your account immediately.
              </div>
            </td>
          </tr>

          <tr>
            <td style="background:#070b14;padding:14px 22px;">
              <div style="font-family:Arial,system-ui,-apple-system,Segoe UI,sans-serif;font-size:11px;color:rgba(234,242,255,0.45);line-height:1.6;">
                Study Zen • Built for focus, not chaos.<br/>
                This is an automated email. Please don’t reply.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</div>
    `.trim();

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        text,
        headers: {
          "X-Entity-Ref-ID": `studyzen-welcome-${Date.now()}`,
        },
      }),
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
