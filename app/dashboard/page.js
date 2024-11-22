"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
import { ref, get } from "firebase/database"; //データ取得に必要
import { database } from "../../firebase.js";
import { useRouter } from "next/navigation";
export default function Dashboard() {
  const [user, setUser] = useState(null); //ユーザー情報を格納
  const [editorExists, setEditorExists] = useState(false); //UIDが存在するかどうかを確認
  const [loading, setLoading] = useState(true); //ローディング情報
  const router = useRouter(); //useRouterを初期化
  useEffect(() => {
    //ユーザー情報の監視
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser); //ログインしているユーザー情報を設定
      if (currentUser) {
        setLoading(false); // ログイン中のユーザーがすぐに判定できたらローディングをスキップ
        //UIDと一致する値があるかどうかを確認
        const uid = currentUser.uid;
        const editorRef = ref(database, `editors/${uid}`); // 動的に参照を設定

        try {
          const snapshot = await get(editorRef);
          if (snapshot.exists()) {
            setEditorExists(true); //UIDと一致する場合
            router.push("/success");
          } else {
            setEditorExists(false); //UIDと一致しない場合
            router.push("/error");
          }
        } catch (error) {
          console.error("データベースエラー", error);
          setEditorExists(false);
        }
      } else {
        setEditorExists(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  if (loading) {
    return <p>Loading...</p>; //ローディング中の表示
  }
  return (
    <div>
      <h1>ダッシュボード</h1>
      {user ? (
        <div>
          <p>ログインUID: {user.uid}</p> {/* UIDを表示 */}
          {editorExists ? (
            <p>データベースに一致するUIDが見つかりました。</p>
          ) : (
            <p>一致するUIDがデータベースに存在しません。</p>
          )}
        </div>
      ) : (
        <p>ログインしていません。</p> //未ログインの場合
      )}
    </div>
  );
}
