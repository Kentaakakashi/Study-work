import type { Handler } from "@netlify/functions";
import crypto from "crypto";
import admin from "firebase-admin";

function getAdmin() {
  if (admin.apps.length) return admin;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT env var");

  let creds;
  try {
    creds = JSON.parse(raw);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT must be valid JSON");
  }

  admin.initializeApp({
    credential: admin.credential.cert(creds),
  });

  return admin;
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const authHeader = event.headers?.authorization || event.headers?.Authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return { statusCode: 401, body: "Missing Authorization bearer token" };
    }

    const adminApp = getAdmin();
    const decoded = await adminApp.auth().verifyIdToken(token);
    const requesterUid = decoded?.uid;
    if (!requesterUid) {
      return { statusCode: 401, body: "Invalid token" };
    }

    const db = adminApp.firestore();
    const requesterStats = await db.collection("stats").doc(requesterUid).get();
    const requesterRole = requesterStats.exists ? requesterStats.data()?.role : null;
    if (requesterRole !== "owner") {
      return { statusCode: 403, body: "Owner only" };
    }

    const cloudName = process.env.CLOUDINARY_VIDEO_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_VIDEO_API_KEY;
    const apiSecret = process.env.CLOUDINARY_VIDEO_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return { statusCode: 500, body: "Missing ambient Cloudinary env vars" };
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const folder = typeof body.folder === "string" && body.folder.trim()
      ? body.folder.trim()
      : "studyzen-ambient/uploads";

    const requestedType = body.resourceType === "video" ? "video" : "image";
    const timestamp = Math.floor(Date.now() / 1000);

    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto
      .createHash("sha1")
      .update(paramsToSign + apiSecret)
      .digest("hex");

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cloudName,
        apiKey,
        timestamp,
        folder,
        signature,
        resourceType: requestedType,
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: error?.message || "Server error",
    };
  }
};
