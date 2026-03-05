// netlify/functions/cloudinary-sign.ts
import type { Handler } from "@netlify/functions";
import crypto from "crypto";

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
    const apiKey = process.env.CLOUDINARY_API_KEY!;
    const apiSecret = process.env.CLOUDINARY_API_SECRET!;

    if (!cloudName || !apiKey || !apiSecret) {
      return { statusCode: 500, body: "Missing Cloudinary env vars" };
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const folder = body.folder || "study-zen/users";

    const timestamp = Math.floor(Date.now() / 1000);

    // Parameters that must be signed (keep it minimal + consistent)
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto
      .createHash("sha1")
      .update(paramsToSign + apiSecret)
      .digest("hex");

    return {
      statusCode: 200,
      body: JSON.stringify({
        cloudName,
        apiKey,
        timestamp,
        folder,
        signature,
      }),
      headers: { "Content-Type": "application/json" },
    };
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || "Server error" };
  }
};
