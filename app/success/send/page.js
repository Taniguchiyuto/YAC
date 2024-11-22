"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDatabase, ref, get, update } from "firebase/database";

const DisplayAndUpdateDatabase = () => {
  const router = useRouter(); // ページ遷移用のフック
  const database = getDatabase(); // Firebase Database インスタンス

  useEffect(() => {
    const handleDisplayAndUpdate = async () => {
      if (localStorage.length === 0) {
        console.log("LocalStorage にデータがありません。");
        return;
      }

      // LocalStorage のデータを取得
      let tempData = null;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);

        if (key === "tempData") {
          tempData = JSON.parse(value); // データを解析
        }
      }

      // tempData が存在しない場合は終了
      if (!tempData) {
        console.log("tempData が見つかりません。");
        return;
      }

      try {
        console.log("Updating database with:", tempData);

        const applicationRef = ref(
          database,
          `applications/${tempData.projID}` // プロジェクト ID を使用
        );

        // 既存データを取得
        const snapshot = await get(applicationRef);

        if (snapshot.exists()) {
          const existingData = snapshot.val();
          const existingApplicatorID = existingData.applicatorID || ""; // 既存の applicatorID を取得

          // applicatorID をカンマで分割して配列化
          const applicatorArray = existingApplicatorID
            ? existingApplicatorID.split(",")
            : [];

          // uid が既に含まれていない場合のみ追加
          if (!applicatorArray.includes(tempData.uid)) {
            applicatorArray.push(tempData.uid);
          }

          // 配列を再びカンマ区切りの文字列に結合
          const newApplicatorID = applicatorArray.join(",");

          // 更新するデータ
          const updatedData = {
            ...existingData, // 既存データを保持
            applicationDate: new Date().toISOString(), // 現在の日付を更新
            applicatorID: newApplicatorID, // 重複を防いだ applicatorID
            status: "pending", // ステータスを更新
          };

          // Firebase データベースを更新
          await update(applicationRef, updatedData);
          console.log("Database updated successfully:", updatedData);
        } else {
          // データが存在しない場合、初期データを作成
          const initialData = {
            applicationDate: new Date().toISOString(), // 現在の日付を設定
            applicatorID: tempData.uid, // 新規 UID を設定
            nickName: tempData.nickName || "Unknown", // デフォルト値を設定
            projectID: tempData.projID, // プロジェクト ID
            status: "pending", // 初期ステータス
          };

          await update(applicationRef, initialData);
          console.log("Database created successfully:", initialData);
        }
      } catch (error) {
        console.error("Database update failed:", error);
      }

      // データ表示後、LocalStorage を削除
      localStorage.clear(); // 全てのデータを削除
      console.log("LocalStorage のデータが削除されました。");

      // ページ遷移
      router.push("/success"); // success ページに遷移
    };

    // 関数実行
    handleDisplayAndUpdate();
  }, [router, database]); // router と database を依存配列に追加

  return null; // UIは特に不要
};

export default DisplayAndUpdateDatabase;
