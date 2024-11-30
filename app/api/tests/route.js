import { google } from "googleapis";
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

// Gmail API の OAuth2 クライアント設定
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

// POSTメソッドの処理
export async function POST(req) {
  try {
    const body = await req.json(); //手動でボディをパース
    const { email, subject, body: emailBody } = body;

    // 必須情報が不足している場合、エラーを返す
    if (!email || !subject || !emailBody) {
      return new Response(
        JSON.stringify({
          error: "必須の情報 (email, subject, body) が不足しています。",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Gmail API インスタンスを作成
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const message = [
      `From: "Your Project" <your-email@gmail.com>`,
      `To: ${email}`,
      `Subject: ${subject}`,
      ``,
      `${emailBody}`,
    ].join("\n");

    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encodedMessage },
    });

    // メール送信後、成功レスポンスを返す
    return new Response(JSON.stringify({ message: "メールを送信しました" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("エラー:", error);
    // エラーハンドリング
    return new Response(
      JSON.stringify({ error: "メール送信中にエラーが発生しました" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
