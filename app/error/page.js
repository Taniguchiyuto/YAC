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
    <div>
      <h1>エラー</h1>
      <p>一致するデータが見つかりませんでした。</p>
      <hr />
      <h2>新しいエディターを追加</h2>
      {uid ? (
        <>
          <p>現在のUID: {uid}</p> {/* UIDを表示 */}
          <input
            type="text"
            placeholder="ニックネームを入力"
            value={nickName}
            onChange={(e) => setNickName(e.target.value)} // NickNameを更新
          />
          <br />
          <button onClick={handleAddEditor}>追加</button>
        </>
      ) : (
        <p>ログインしてください。</p>
      )}
      {message && <p>{message}</p>} {/* メッセージを表示 */}
    </div>
  );
}
