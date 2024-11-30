import { google } from "googleapis";
import admin from "firebase-admin";
import serviceAccount from "../../../firebase-admin-key.json"; // Firebase関連のファイルをインポート
import { config } from "dotenv";

// .env ファイルを読み込む
config();

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
  throw new Error(
    "Failed to initialize Firebase Admin SDK. Check your service account file."
  );
}

// Gmail API の OAuth2 クライアント設定
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN || !REDIRECT_URI) {
  throw new Error(
    "Gmail API credentials are not set in environment variables."
  );
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

export async function POST(req) {
  try {
    const userRecords = await admin.auth().listUsers();
    const emails = userRecords.users.map((user) => user.email);

    console.log("Fetched User Emails:", emails);

    const { subject, body } = await req.json();
    if (!subject || !body) {
      return new Response(
        JSON.stringify({ error: "Subject and body are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    for (const toEmail of emails) {
      const message = [
        `From: "Your Project" <youdougukou5@example.com>`,
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

      console.log(`Sending email to: ${toEmail}`);

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
