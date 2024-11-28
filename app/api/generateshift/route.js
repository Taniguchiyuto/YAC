import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    // プロンプトを文字列に変換
    const formattedPrompt = JSON.stringify(prompt, null, 2);

    // ChatGPT APIを呼び出す
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: formattedPrompt }],
    });

    const chatMessage = chatResponse.choices[0].message.content;

    // ChatGPTのレスポンスを返す
    return NextResponse.json({ message: chatMessage });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Error processing your request" },
      { status: 500 }
    );
  }
}
