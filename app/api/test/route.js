import admin from "firebase-admin";
import { config } from "dotenv";

// .env ファイルを読み込む
config();

try {
  // 環境変数からサービスアカウント情報を構築
  const serviceAccount = {
    type: process.env.SERVICE_ACCOUNT_TYPE,
    project_id: process.env.SERVICE_ACCOUNT_PROJECT_ID,
    private_key_id: process.env.SERVICE_ACCOUNT_PRIVATE_KEY_ID,
    private_key: process.env.SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n"), // 改行文字を正しい形式に変換
    client_email: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
    client_id: process.env.SERVICE_ACCOUNT_CLIENT_ID,
    auth_uri: process.env.SERVICE_ACCOUNT_AUTH_URI,
    token_uri: process.env.SERVICE_ACCOUNT_TOKEN_URI,
    auth_provider_x509_cert_url:
      process.env.SERVICE_ACCOUNT_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.SERVICE_ACCOUNT_CLIENT_CERT_URL,
  };

  // Firebase Admin SDK の初期化
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK Initialized with Environment Variables");
  }
} catch (error) {
  console.error("Error initializing Firebase Admin SDK:", error);
  throw new Error(
    "Failed to initialize Firebase Admin SDK. Check your environment variables."
  );
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
