// app/LoginPage.js
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation"; // Next.js の useRouter フック
import loginUser from "../auth/loginUser"; // loginUser.js のパスに応じて変更
import registerUser from "../auth/registerUser"; // registerUser.js のパスに応じて変更
import resetPassword from "../auth/resetPassword";
export default function LoginPage() {
  const [mode, setMode] = useState("login"); // "login" | "register" | "reset"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter(); // useRouter フックの呼び出し

  // 登録処理
  const handleRegister = async () => {
    try {
      await registerUser(email, password);
      router.push("/dashboard");
    } catch (error) {
      console.error("登録エラー:", error.message);
      alert("登録に失敗しました。");
    }
  };

  // ログイン処理
  const handleLogin = async () => {
    try {
      await loginUser(email, password);
      router.push("/dashboard");
    } catch (error) {
      console.error("ログインエラー:", error.message);
      alert("ログインに失敗しました。");
    }
  };

  // パスワードリセット処理
  const handleResetPassword = async () => {
    try {
      await resetPassword(email);
      alert(
        "パスワードリセットメールが送信されました。メールを確認してください。"
      );
      setMode("login"); // リセット後にログイン画面に戻す
    } catch (error) {
      console.error("パスワードリセットエラー:", error.message);
      alert("パスワードリセットに失敗しました。");
    }
  };

  // フォーム送信処理
  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === "register") {
      handleRegister();
    } else if (mode === "login") {
      handleLogin();
    } else if (mode === "reset") {
      handleResetPassword();
    }
  };

  return (
    <div>
      <h1>
        {mode === "register"
          ? "ユーザー登録"
          : mode === "login"
          ? "ログイン"
          : "パスワードリセット"}
      </h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {mode !== "reset" && (
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}
        <button type="submit">
          {mode === "register"
            ? "登録"
            : mode === "login"
            ? "ログイン"
            : "リセットリンクを送信"}
        </button>
      </form>
      <p>
        {mode === "register" ? (
          <>
            既にアカウントをお持ちですか？{" "}
            <button onClick={() => setMode("login")}>ログイン</button>
          </>
        ) : mode === "login" ? (
          <>
            アカウントをお持ちでないですか？{" "}
            <button onClick={() => setMode("register")}>新規登録</button>
            <br />
            パスワードを忘れた場合は{" "}
            <button onClick={() => setMode("reset")}>こちら</button>
          </>
        ) : (
          <>
            パスワードを思い出した場合は{" "}
            <button onClick={() => setMode("login")}>ログインに戻る</button>
          </>
        )}
      </p>
    </div>
  );
}
