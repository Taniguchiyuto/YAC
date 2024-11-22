"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // ページ遷移用のフック
import { ref, get } from "firebase/database";
import { database } from "../../firebase.js";
import { getAuth } from "firebase/auth";
import "./page.css";

export default function ProjectDetails() {
  const [projects, setProjects] = useState(null); // プロジェクト情報を格納
  const [loading, setLoading] = useState(true); // ローディング情報
  const [error, setError] = useState(null); // エラー情報
  const [isModalOpen, setIsModalOpen] = useState(false); // モーダル表示状態
  const router = useRouter(); // ページ遷移用のフック
  const [selectedProject, setSelectedProject] = useState(null); // 選択されたプロジェクト

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

  // 初回マウント時にプロジェクト情報を取得
  useEffect(() => {
    fetchProjectData();
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

  // ローディング中の表示
  if (loading) return <p>読み込み中...</p>;

  // エラー発生時の表示
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  const handlePostJob = () => {
    // ボタンを押したときの処理（例: 別ページに遷移）
    router.push("/success/job"); // 遷移先を変更
  };

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
