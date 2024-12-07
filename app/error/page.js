"use client";

import { useState, useEffect } from "react";
import { ref, set } from "firebase/database"; // setを使用
import { auth } from "../../firebase"; // Firebase Authentication
import { database } from "../../firebase"; // Firebase Realtime Database
import { useRouter } from "next/navigation"; // Next.jsのルーティング機能

export default function ErrorPage() {
  const [nickName, setNickName] = useState(""); // NickNameを管理
  const [uid, setUid] = useState(null); // 現在ログイン中のユーザーのUIDを管理
  const [message, setMessage] = useState(""); // 操作結果のメッセージを管理
  const router = useRouter(); // ルーティング機能を使用

  // ログイン中のユーザーのUIDを取得
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUid(user.uid); // ログイン中のUIDを設定
      } else {
        setUid(null); // ログインしていない場合はUIDをクリア
      }
    });
    return () => unsubscribe(); // クリーンアップ
  }, []);

  const handleAddEditor = async () => {
    if (!uid) {
      setMessage("ログインしているユーザーが必要です。");
      return;
    }

    if (!nickName) {
      setMessage("ニックネームを入力してください。");
      return;
    }

    try {
      // UIDを使ってデータを保存
      await set(ref(database, `editors/${uid}`), {
        editorID: uid, // UIDをeditorIDとして保存
        nickName: nickName, // 入力されたニックネームを保存
      });

      setMessage(`ユーザー「${nickName}」が追加されました。`);
      setNickName(""); // 入力フィールドをクリア

      // データ保存後に/dashboardへ移動
      router.push("/dashboard");
    } catch (error) {
      console.error("データベースエラー:", error);
      setMessage("データの追加に失敗しました。");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>💐そくしふへようこそ💐</h1>
        {/* <p style={styles.description}>ニックネームを入力してください！</p> */}
        <hr style={styles.separator} />
        <h2 style={styles.subtitle}>ニックネームを入力してください</h2>
        {uid ? (
          <>
            <p style={styles.uid}>
              現在のUID: <strong>{uid}</strong>
            </p>
            <input
              type="text"
              placeholder="ニックネームを入力"
              value={nickName}
              onChange={(e) => setNickName(e.target.value)}
              style={styles.input}
            />
            <button onClick={handleAddEditor} style={styles.button}>
              追加
            </button>
          </>
        ) : (
          <p style={styles.errorText}>ログインしてください。</p>
        )}
        {message && <p style={styles.message}>{message}</p>}
      </div>
    </div>
  );
}

// CSS-in-JSのスタイル定義
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f9f9f9",
    padding: "20px",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "10px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    padding: "20px",
    width: "100%",
    maxWidth: "400px",
    textAlign: "center",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "10px",
  },
  description: {
    fontSize: "16px",
    color: "#666",
    marginBottom: "20px",
  },
  separator: {
    border: "0",
    height: "1px",
    backgroundColor: "#ddd",
    margin: "20px 0",
  },
  subtitle: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#555",
    marginBottom: "15px",
  },
  uid: {
    fontSize: "14px",
    color: "#888",
    marginBottom: "10px",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "15px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    fontSize: "14px",
    color: "#333",
  },
  button: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#007BFF",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
  buttonHover: {
    backgroundColor: "#0056b3",
  },
  errorText: {
    fontSize: "14px",
    color: "red",
    marginTop: "10px",
  },
  message: {
    marginTop: "10px",
    fontSize: "14px",
    color: "#28a745",
  },
};
