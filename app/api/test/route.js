import admin from "firebase-admin";
import path from "path";

// Firebase Admin SDK の初期化
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      require(path.resolve("config/service-account.json"))
    ),
  });
}

export async function POST(req) {
  const body = await req.json(); // `req.body` の代わりに `await req.json()` を使用
  const { uid } = body;

  if (!uid) {
    return new Response(JSON.stringify({ error: "UID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const userRecord = await admin.auth().getUser(uid);
    const email = userRecord.email;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email not found for this UID" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ email }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching user email:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch user email" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
