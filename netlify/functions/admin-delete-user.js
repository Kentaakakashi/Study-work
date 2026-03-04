/*
  Owner-only user nuke endpoint.
  - Verifies Firebase ID token from Authorization: Bearer <token>
  - Refuses to delete owners
  - Deletes Firebase Auth user + most Firestore data that references the uid

  Required env:
    FIREBASE_SERVICE_ACCOUNT = JSON string of a Firebase service account
*/

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

async function deleteSubcollection(db, docRef, subName, batchSize = 400) {
  const snap = await docRef.collection(subName).limit(batchSize).get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  await deleteSubcollection(db, docRef, subName, batchSize);
}

async function deleteQuery(db, q, batchSize = 400) {
  const snap = await q.limit(batchSize).get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  await deleteQuery(db, q, batchSize);
}

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
    }

    const authHeader = event.headers?.authorization || event.headers?.Authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ error: "Missing Authorization bearer token" }) };
    }

    const { targetUid } = JSON.parse(event.body || "{}");
    if (!targetUid || typeof targetUid !== "string") {
      return { statusCode: 400, body: JSON.stringify({ error: "targetUid is required" }) };
    }

    const a = getAdmin();
    const decoded = await a.auth().verifyIdToken(token);
    const requesterUid = decoded?.uid;
    if (!requesterUid) {
      return { statusCode: 401, body: JSON.stringify({ error: "Invalid token" }) };
    }

    const db = a.firestore();

    // owner check (based on your existing stats doc role)
    const requesterStats = await db.collection("stats").doc(requesterUid).get();
    const requesterRole = requesterStats.exists ? requesterStats.data()?.role : null;
    if (requesterRole !== "owner") {
      return { statusCode: 403, body: JSON.stringify({ error: "Owner only" }) };
    }

    const targetStats = await db.collection("stats").doc(targetUid).get();
    const targetRole = targetStats.exists ? targetStats.data()?.role : null;
    if (targetRole === "owner") {
      return { statusCode: 400, body: JSON.stringify({ error: "Refusing to delete an owner" }) };
    }

    // --- Firestore deletes ---
    const deletes = [];

    deletes.push(db.collection("profiles").doc(targetUid).delete().catch(() => null));
    deletes.push(db.collection("stats").doc(targetUid).delete().catch(() => null));
    deletes.push(db.collection("presence").doc(targetUid).delete().catch(() => null));

    // sessions/{uid}/items
    const sessionsDoc = db.collection("sessions").doc(targetUid);
    deletes.push(deleteSubcollection(db, sessionsDoc, "items").catch(() => null));

    // friends/{uid}/list + reciprocal cleanup
    const friendsDoc = db.collection("friends").doc(targetUid);
    const friendsSnap = await friendsDoc.collection("list").get().catch(() => null);
    if (friendsSnap && !friendsSnap.empty) {
      for (const f of friendsSnap.docs) {
        const otherUid = f.id;
        deletes.push(db.collection("friends").doc(otherUid).collection("list").doc(targetUid).delete().catch(() => null));
        deletes.push(f.ref.delete().catch(() => null));
      }
    }

    // follows (from/to)
    deletes.push(deleteQuery(db, db.collection("follows").where("from", "==", targetUid)).catch(() => null));
    deletes.push(deleteQuery(db, db.collection("follows").where("to", "==", targetUid)).catch(() => null));

    // notifications
    deletes.push(deleteQuery(db, db.collection("notifications").where("toUid", "==", targetUid)).catch(() => null));
    deletes.push(deleteQuery(db, db.collection("notifications").where("fromUid", "==", targetUid)).catch(() => null));

    // support tickets + messages
    const ticketsSnap = await db.collection("supportTickets").where("uid", "==", targetUid).get().catch(() => null);
    if (ticketsSnap && !ticketsSnap.empty) {
      for (const t of ticketsSnap.docs) {
        deletes.push(deleteSubcollection(db, t.ref, "messages").catch(() => null));
        deletes.push(t.ref.delete().catch(() => null));
      }
    }

    // posts + comments (their posts)
    const postsSnap = await db.collection("posts").where("uid", "==", targetUid).get().catch(() => null);
    if (postsSnap && !postsSnap.empty) {
      for (const p of postsSnap.docs) {
        deletes.push(deleteSubcollection(db, p.ref, "comments").catch(() => null));
        deletes.push(p.ref.delete().catch(() => null));
      }
    }

    // comments they left anywhere (collectionGroup)
    deletes.push(deleteQuery(db, db.collectionGroup("comments").where("uid", "==", targetUid)).catch(() => null));

    await Promise.all(deletes);

    // --- Auth delete ---
    await a.auth().deleteUser(targetUid).catch(() => null);

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err?.message || "Server error" }) };
  }
};
