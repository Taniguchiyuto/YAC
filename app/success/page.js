"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // ページ遷移用のフック
import { ref, get } from "firebase/database";
import { database } from "../../firebase.js";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { MutatingDots } from "react-loader-spinner";

import "./page.css";

export default function ProjectDetails() {
  const [uid, setUid] = useState(null); //UIDを格納

  const [projects, setProjects] = useState(null); // プロジェクト情報を格納
  const [loading, setLoading] = useState(true); // ローディング情報
  const [error, setError] = useState(null); // エラー情報
  const [isModalOpen, setIsModalOpen] = useState(false); // モーダル表示状態
  const router = useRouter(); // ページ遷移用のフック
  const [selectedProject, setSelectedProject] = useState(null); // 選択されたプロジェクト
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false); // モーダルの表示状態
  const [password, setPassword] = useState(""); // 入力されたパスワード
  const [errorMessage, setErrorMessage] = useState(""); // パスワードエラー
  // 正しいパスワード（必要に応じてバックエンド検証に変更可能）
  const correctPassword = "yac";

  const handlePostJob = () => {
    setIsPasswordModalOpen(true); // パスワードモーダルを開く
  };
  const handlePasswordSubmit = () => {
    if (password === correctPassword) {
      setErrorMessage("");
      setIsPasswordModalOpen(false);
      router.push("/success/job"); // 正しい場合のみ遷移
    } else {
      setErrorMessage("パスワードが間違っています"); // エラーメッセージを表示
    }
  };

  // プロジェクト情報を取得する関数
  const fetchProjectData = async () => {
    const projectRef = ref(database, "projects"); // projects 全体を参照
    try {
      const snapshot = await get(projectRef);
      if (snapshot.exists()) {
        const projectsData = snapshot.val(); // 全プロジェクトデータを取得
        const projectList = Object.keys(projectsData).map((key) => ({
          id: key, // proj1, proj2 などのキー
          ...projectsData[key], // 各プロジェクトのデータ
        }));
        setProjects(projectList); // 複数プロジェクトを設定
      } else {
        setError("プロジェクトが見つかりませんでした");
      }
    } catch (err) {
      setError("データを取得中にエラーが発生しました。");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 初回マウント時にプロジェクト情報を取得、そして、uidも取得
  useEffect(() => {
    fetchProjectData();
    const auth = getAuth(); //Firebase Authインスタンスを取得
    //ログイン状態を監視してUIDを取得
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid); //UIDを　Reacの状態に保存
        console.log("ログイン中のUID:", user.uid);
      } else {
        console.log("ログインしていません");
      }
    });
    console.log("リスナーが登録されました");
    //クリーンアップ関数でリスナーを解除
    return () => {
      unsubscribe(); //リスナー解除
      console.log("リスナーが解除されました");
    };
  }, []);

  // モーダルを開く
  const handleCardClick = (project) => {
    setSelectedProject(project); // クリックされたプロジェクトを設定
    setIsModalOpen(true);
  };

  // モーダルを閉じる
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  // モーダルの「はい」をクリックしたときの動作
  const handleModalConfirm = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        console.error(
          "ユーザーがログインしていません。UIDを取得できませんでした。"
        );
        return;
      }

      const uid = user.uid;

      if (!selectedProject) {
        console.error("選択されたプロジェクトが存在しません。");
        return;
      }

      const projID = selectedProject.projectID;

      const tempData = {
        uid: uid,
        projID: projID,
        key1: "value1",
        key2: "value2",
      };

      localStorage.setItem("tempData", JSON.stringify(tempData));

      // モーダルを閉じる＆選択プロジェクトをリセット
      setIsModalOpen(false);
      setSelectedProject(null);

      // 次のページへ遷移
      router.push("/success/send");
    } catch (error) {
      console.error("handleModalConfirm 内でエラーが発生しました:", error);
    }
  };

  // ローディング中の処理
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <MutatingDots
          height={100}
          width={100}
          color="#4fa94d"
          secondaryColor="#f2a900"
          radius={12.5}
          ariaLabel="loading"
          wrapperStyle={{}}
          wrapperClass=""
          visible={true}
        />
      </div>
    );
  }

  // エラー発生時の表示
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  // const handlePostJob = () => {
  //   // ボタンを押したときの処理（例: 別ページに遷移）
  //   router.push("/success/job"); // 遷移先を変更
  // };

  // プロジェクトデータの表示
  return (
    <div className="page-content">
      <div className="header">
        <h1>プロジェクト詳細</h1>
        <button onClick={handlePostJob} className="post-job-button">
          求人を出す
        </button>
      </div>
      <div className="content">
        {/* 左側スペース */}
        <div className="left-space">
          <p>ここに他の情報を表示できます</p>
        </div>
        {/* 右側カードリスト */}
        <div className="right-cards">
          {projects.length > 0 ? (
            projects.map((project) =>
              project.status === "open" ? (
                <div key={project.id}>
                  <ProjectDetailsCard
                    project={project}
                    onClick={() => handleCardClick(project)} // プロジェクトを渡す
                  />
                  {isModalOpen && selectedProject?.id === project.id && (
                    <Modal
                      onClose={handleModalClose}
                      onConfirm={handleModalConfirm}
                    />
                  )}
                </div>
              ) : null
            )
          ) : (
            <p>プロジェクト情報がありません。</p>
          )}
        </div>
      </div>
      {isPasswordModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "10px",
              width: "300px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h2 style={{ marginBottom: "10px", textAlign: "center" }}>
              パスワードを入力
            </h2>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "5px",
                marginBottom: "10px",
              }}
              placeholder="パスワードを入力"
            />
            <button
              onClick={handlePasswordSubmit}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "#007BFF",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                marginBottom: "10px",
              }}
            >
              確認
            </button>
            {errorMessage && (
              <p style={{ color: "red", textAlign: "center" }}>
                {errorMessage}
              </p>
            )}
            <button
              onClick={() => setIsPasswordModalOpen(false)}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "#6c757d",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// プロジェクト詳細カードコンポーネント
function ProjectDetailsCard({ project, onClick }) {
  return (
    <div
      className="card-container"
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      <p>
        <strong>タイトル:</strong> {project.title}
      </p>
      <p>
        <strong>プロジェクトID:</strong> {project.id}
      </p>
      <p>
        <strong>状態:</strong> {project.status}
      </p>
      <p>
        <strong>締切:</strong> {new Date(project.deadline).toLocaleString()}
      </p>
      <p>
        <strong>納品日:</strong>{" "}
        {new Date(project.deliveryDate).toLocaleString()}
      </p>
      <p>
        <strong>最終担当者:</strong> {project.finalMan}
      </p>
      <p>
        <strong>報酬:</strong> {project.reward} 円
      </p>
      <p>
        <strong>ペナルティ:</strong> {project.penalty} 円
      </p>
    </div>
  );
}

// モーダルコンポーネント
function Modal({ onClose, onConfirm }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>操作を確認</h2>
        <p>この動画の編集を申し出ますか？(確定ではありません)</p>
        <div className="modal-buttons">
          <button onClick={onConfirm} className="modal-confirm">
            はい
          </button>
          <button onClick={onClose} className="modal-cancel">
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
