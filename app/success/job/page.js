"use client";

import React, { useState } from "react";
import { ref, get, set } from "firebase/database";
import { database } from "../../../firebase.js";
import { useRouter } from "next/navigation";

export default function CreateNewProject() {
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [finalMan, setFinalMan] = useState("");
  const [penalty, setPenalty] = useState("");
  const [reward, setReward] = useState("");
  const [bonus, setBonus] = useState("");
  const [status, setStatus] = useState("open"); // デフォルト値
  const goToActiveProjects = () => {
    router.push("/projects/active"); // 遷移先を指定
  };
  const goToShiftPage = () => {
    router.push("/projects/shift"); // 遷移先を指定
  };
  const router = useRouter(); // 修正済み
  const goToMainPage = () => {
    alert("メインページに戻ります！");
    router.push("/success"); // 修正済み: 正しいメソッドで遷移
  };

  const combinedSubmitHandler = async (e) => {
    e.preventDefault(); // ページのリロードを防ぐ

    // 他の関数を呼び出す
    handleSubmit();

    // 既存の handleSubmit を呼び出す
    await createNewApplication(e);
  };

  const createNewApplication = async (e) => {
    try {
      //Firebaseのプロジェクトリファレンス
      const projectRef = ref(database, "projects");
      const snapshot = await get(projectRef);
      let newProjectID = "proj1"; //初期値

      //プロジェクトIDを生成
      if (snapshot.exists()) {
        const existingProjects = snapshot.val();
        const projectIDs = Object.keys(existingProjects).map((id) =>
          parseInt(id.replace("proj", ""))
        );
        const maxID = Math.max(...projectIDs);
        newProjectID = `proj${maxID + 1}`; // 新しいIDを生成
      }
      const currentDateTime = new Date().toISOString();
      // userInputData を作成
      const userInputData = {
        applicationDate: currentDateTime, // 現在時刻を使用
        applicationID: newProjectID, // 一意のIDを生成
        applicatorID: "",
        nickName: "",
        projectID: newProjectID,
        status: "pending",
      };

      const newProjectRef = ref(database, `applications/${newProjectID}`);
      await set(newProjectRef, userInputData);

      // 正しいテンプレートリテラル
    } catch {}
  };
  const handleSubmit = async (e) => {
    try {
      // Firebaseのプロジェクトリファレンス
      const projectsRef = ref(database, "projects");
      const snapshot = await get(projectsRef);

      let newProjectID = "proj1"; // 初期値

      // プロジェクトIDを生成
      if (snapshot.exists()) {
        const existingProjects = snapshot.val();
        const projectIDs = Object.keys(existingProjects).map((id) =>
          parseInt(id.replace("proj", ""))
        );
        const maxID = Math.max(...projectIDs);
        newProjectID = `proj${maxID + 1}`; // 新しいIDを生成
      }

      // ユーザー入力データ
      const userInputData = {
        title,
        deadline: new Date(deadline).toISOString(),
        deliveryDate: new Date(deliveryDate).toISOString(),
        finalMan,
        penalty: parseInt(penalty),
        reward: parseInt(reward),
        status,
        bonus: parseInt(bonus),
        projectID: newProjectID,
      };

      // Firebaseにプロジェクトデータを保存
      const newProjectRef = ref(database, `projects/${newProjectID}`);
      await set(newProjectRef, userInputData);

      // 通知メールを送信
      try {
        const response = await fetch("/api/sendMail", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subject: `new_project`,
            body: `新しい案件「${userInputData.title}」が作成されました。詳細をご確認ください。`,
          }),
        });

        if (!response.ok) {
          throw new Error(`メール送信に失敗しました: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("通知メール送信結果:", result);
      } catch (error) {
        console.error("通知メール送信中にエラーが発生しました:", error);
      }

      alert(`新しいプロジェクト「${newProjectID}」が作成されました`);
    } catch (error) {
      console.error("プロジェクト作成中にエラーが発生しました:", error);
      alert("プロジェクト作成に失敗しました");
    }
  };

  return (
    <div
      style={{
        display: "flex", // 横並びレイアウト
        flexDirection: "row",
        height: "100vh", // ビューポート全体の高さを確保
        overflow: "hidden", // 全体で余分なスクロールを防止
      }}
    >
      {/* サイドバー */}
      <div
        className="sidebar"
        style={{
          width: "250px",
          backgroundColor: "#007BFF",
          color: "#fff",
          padding: "20px",
          boxShadow: "2px 0 5px rgba(0, 0, 0, 0.1)",
          overflowY: "auto", // サイドバーの縦スクロールを有効化
          height: "100vh", // 全画面高さを確保
        }}
      >
        <h2
          style={{
            textAlign: "center",
            fontWeight: "bold",
            marginBottom: "20px",
          }}
        >
          サイドバー
        </h2>
        <ul style={{ listStyle: "none", padding: "0", lineHeight: "2.5em" }}>
          <li>
            <a
              href="#"
              style={{
                color: "#fff",
                textDecoration: "none",
              }}
              onClick={goToMainPage}
            >
              ホームへ戻る
            </a>
          </li>
          <li>
            <a
              href="#"
              style={{
                color: "#fff",
                textDecoration: "none",
              }}
              onClick={goToActiveProjects} // クリック時に遷移関数を呼び出す
            >
              現在募集中のプロジェクト
            </a>
          </li>
          <li>
            <a
              href="#"
              style={{
                color: "#fff",
                textDecoration: "none",
              }}
              onClick={goToShiftPage}
            >
              シフトを作成
            </a>
          </li>
          <li>
            <a
              href="#"
              style={{
                color: "#fff",
                textDecoration: "none",
              }}
            >
              ヘルプ
            </a>
          </li>
        </ul>
      </div>

      {/* メインコンテンツ */}
      <div
        className="main"
        style={{
          flex: 1, // 残りの幅を使用
          padding: "20px",
          overflowY: "auto", // 縦スクロールを有効化
          height: "100vh", // 全画面高さを確保
        }}
      >
        <div
          style={{
            maxWidth: "600px",
            margin: "20px auto",
            padding: "20px",
            border: "1px solid #ccc",
            borderRadius: "10px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            backgroundColor: "#fff",
          }}
        >
          <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
            新しいプロジェクトを作成
          </h1>
          <form onSubmit={combinedSubmitHandler}>
            <div style={{ marginBottom: "15px" }}>
              <label>タイトル:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  marginTop: "5px",
                }}
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label>締切 (Deadline):</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  marginTop: "5px",
                }}
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label>素材提供日 (Delivery Date):</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  marginTop: "5px",
                }}
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label>担当者 (Final Man):</label>
              <input
                type="text"
                value={finalMan}
                onChange={(e) => setFinalMan(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  marginTop: "5px",
                }}
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label>ペナルティ (Penalty):</label>
              <input
                type="number"
                value={penalty}
                onChange={(e) => setPenalty(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  marginTop: "5px",
                }}
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label>報酬 (Reward):</label>
              <input
                type="number"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  marginTop: "5px",
                }}
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label>ボーナス (Bonus):</label>
              <input
                type="number"
                value={bonus}
                onChange={(e) => setBonus(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  marginTop: "5px",
                }}
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label>ステータス (Status):</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  marginTop: "5px",
                }}
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "#007BFF",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              プロジェクトを作成
            </button>
          </form>
          <button
            onClick={goToMainPage}
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "10px",
              backgroundColor: "#6c757d",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            メインページに戻る
          </button>
        </div>
      </div>
    </div>
  );
}
