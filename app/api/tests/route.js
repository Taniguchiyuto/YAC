import { google } from "googleapis";
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
      `${body}`,
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