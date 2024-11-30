import { google } from "googleapis";
import admin from "firebase-admin";
import path from "path";

try {
  // デバッグ: ファイルパスと内容を確認
  const serviceAccountPath = path.resolve("config/service-account.json");
  console.log("Resolved Service Account Path:", serviceAccountPath);

  const serviceAccount = require(serviceAccountPath);
  console.log("Service Account Content:", serviceAccount);

  // Firebase Admin SDK の初期化
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount), // サービスアカウントキーのパス
    });
    console.log("Firebase Admin SDK Initialized");
  }
} catch (error) {
  console.error("Error initializing Firebase Admin SDK:", error);
  throw new Error(
    "Failed to initialize Firebase Admin SDK. Check the service-account.json file."
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

export async function POST(req) {
  try {
    // Firebase Authentication からユーザーリストを取得
    const userRecords = await admin.auth().listUsers();
    const emails = userRecords.users.map((user) => user.email); // メールアドレスリスト

    // デバッグ: ユーザーリストを確認
    console.log("Fetched User Emails:", emails);

    // リクエストボディからデータを取得
    const { subject, body } = await req.json();
    console.log("Request Data:", { subject, body });

    // Gmail API インスタンスを作成
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // 各メールアドレスにメールを送信
    for (const toEmail of emails) {
      const message = [
        `From: "Your Project" <youdougukou5@gmail.com>`,
        `To: ${toEmail}`,
        `Subject: ${subject}`,
        ``,
        `${body}`,
      ].join("\n");

      const encodedMessage = Buffer.from(message)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      // デバッグ: メール内容を確認
      console.log("Encoded Message for Email:", encodedMessage);

      await gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: encodedMessage,
        },
      });

      console.log(`メールを送信しました: ${toEmail}`);
    }

    return new Response(
      JSON.stringify({ message: "全てのメールを送信しました" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("メール送信エラー:", {
      message: error.message,
      stack: error.stack,
      response: error.response?.data || "No response",
    });
    return new Response(
      JSON.stringify({ error: "メール送信中にエラーが発生しました" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
