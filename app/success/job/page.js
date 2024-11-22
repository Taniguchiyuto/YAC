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
        applicatorID: "editor123",
        nickName: "Yuto",
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

      //ユーザー入力データ;
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

      // // 新しい application データを作成
      // const newApplicationID = `app${Date.now()}`; // 正しいテンプレートリテラル
      // const newApplicationData = {
      //   applicationDate: "2024-11-17T14:50:12.345Z",
      //   applicationID: "こここ",
      //   applicatorID: "editor123",
      //   nickName: "Yuto",
      //   projectID: newProjectID,
      //   status: "pending",
      // };

      // // // Firebaseに application データを保存 (プロジェクトIDをキーとして保存)
      // const projectApplicationsRef = ref(database, `projects/${newProjectID}`);
      // await set(projectApplicationsRef, newApplicationData);

      alert(`新しいプロジェクト「${newProjectID}」が作成されました`);
    } catch (error) {
      console.error("プロジェクト作成中にエラーが発生しました:", error);
      alert("プロジェクト作成に失敗しました");
    }
  };

  return (
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
  );
}
