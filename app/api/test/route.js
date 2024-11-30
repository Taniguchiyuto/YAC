import admin from "firebase-admin";
import serviceAccount from "../../../firebase-admin-key.json"; // 相対パス

try {
  // Firebase Admin SDK 初期化
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK Initialized using serviceAccount file");
  }
} catch (error) {
  console.error("Error initializing Firebase Admin SDK:", error);
  throw new Error("Failed to initialize Firebase Admin SDK.");
}

export async function POST(req) {
  const body = await req.json(); // リクエストボディを取得
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
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
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
