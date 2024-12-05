"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation"; // Next.js の useRouter フック
import loginUser from "../auth/loginUser"; // loginUser.js のパスに応じて変更
import registerUser from "../auth/registerUser"; // registerUser.js のパスに応じて変更
import resetPassword from "../auth/resetPassword";
import Image from "next/image";
import headerImage from "../public/headerImage.png"; // 3枚目の画像ファイルを参照
// import Particles from "react-tsparticles";
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
    <div style={styles.container}>
      {/* ヘッダー画像 */}
      <div style={styles.header}>
        <Image
          src={headerImage}
          alt="Header Image"
          layout="intrinsic" // 画像の比率を保持
          style={styles.headerImage}
        />
      </div>

      {/* メインコンテンツ */}
      <div style={styles.content}>
        <h1 style={styles.title}>
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
            style={styles.input}
          />
          {mode !== "reset" && (
            <input
              type="password"
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
          )}
          <button type="submit" style={styles.button}>
            {mode === "register"
              ? "登録"
              : mode === "login"
              ? "ログイン"
              : "リセットリンクを送信"}
          </button>
        </form>
        <p style={styles.text}>
          {mode === "register" ? (
            <>
              既にアカウントをお持ちですか？{" "}
              <button
                onClick={() => setMode("login")}
                style={styles.linkButton}
              >
                ログイン
              </button>
            </>
          ) : mode === "login" ? (
            <>
              アカウントをお持ちでないですか？{" "}
              <button
                onClick={() => setMode("register")}
                style={styles.linkButton}
              >
                新規登録
              </button>
              <br />
              パスワードを忘れた場合は{" "}
              <button
                onClick={() => setMode("reset")}
                style={styles.linkButton}
              >
                こちら
              </button>
            </>
          ) : (
            <>
              パスワードを思い出した場合は{" "}
              <button
                onClick={() => setMode("login")}
                style={styles.linkButton}
              >
                ログインに戻る
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

// スタイル設定
const styles = {
  container: {
    fontFamily: "'Arial', sans-serif",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
  },
  header: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "20px", // コンテンツとの間隔
  },
  headerImage: {
    maxWidth: "100%",
    height: "auto", // 比率を保ったまま高さを自動調整
  },
  content: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
    maxWidth: "400px",
    width: "90%",
  },
  title: {
    fontSize: "24px",
    color: "#333",
    marginBottom: "20px",
  },
  input: {
    width: "100%",
    padding: "10px",
    margin: "10px 0",
    borderRadius: "5px",
    border: "1px solid #ddd",
    fontSize: "16px",
  },
  button: {
    backgroundColor: "#007BFF",
    color: "#fff",
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
    marginTop: "10px",
  },
  text: {
    color: "#555",
    marginTop: "20px",
  },
  linkButton: {
    background: "none",
    color: "#007BFF",
    border: "none",
    cursor: "pointer",
    textDecoration: "underline",
    fontSize: "16px",
  },
};
