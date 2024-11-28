import { google } from "googleapis";
import admin from "firebase-admin";
import path from "path";

// Firebase Admin SDK の初期化
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      require(path.resolve("config/service-account.json")) // サービスアカウントキーのパス
      // サービスアカウントキーのパス
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

export async function POST(req) {
  try {
    // Firebase Authentication からユーザーリストを取得
    const userRecords = await admin.auth().listUsers();
    const emails = userRecords.users.map((user) => user.email); // メールアドレスリスト

    // リクエストボディからデータを取得
    const { subject, body } = await req.json();

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
    console.error("メール送信エラー:", error);
    return new Response(
      JSON.stringify({ error: "メール送信中にエラーが発生しました" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
