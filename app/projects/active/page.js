"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth"; // Firebase 認証の取得
import { ref, get, remove } from "firebase/database";
import { database } from "../../../firebase.js";
import { useRouter } from "next/navigation"; // 追加
import { MutatingDots } from "react-loader-spinner";

export default function ActiveProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applicantCounts, setApplicantCounts] = useState({}); // 応募者数を保持

  const handleBack = () => {
    router.push("/success/job/");
  };

  useEffect(() => {
    const auth = getAuth(); // Firebaseの認証情報を取得

    // Firebaseの初期化とユーザーの認証状態を監視
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // Firebaseからprojectsとapplicationsのデータを取得
          const projectsRef = ref(database, "projects");
          const applicationsRef = ref(database, "applications");

          const [projectsSnapshot, applicationsSnapshot] = await Promise.all([
            get(projectsRef),
            get(applicationsRef),
          ]);

          if (projectsSnapshot.exists() && applicationsSnapshot.exists()) {
            const projectsData = projectsSnapshot.val();
            const applicationsData = applicationsSnapshot.val();

            // `planner` が現在のユーザーの `uid` と一致するプロジェクトだけをフィルタリング
            const matchedProjects = Object.keys(projectsData)
              .map((projID) => ({
                ...projectsData[projID],
                projectID: projID,
              }))
              .filter(
                (project) =>
                  project.Planner && project.Planner === currentUser.uid
              );

            setProjects(matchedProjects); // マッチしたプロジェクトを保存

            // 各プロジェクトの応募者数をカウント
            const counts = Object.keys(applicationsData).reduce(
              (acc, projID) => {
                const applicators = applicationsData[projID].applicatorID || "";
                acc[projID] = applicators.split(",").filter(Boolean).length; // カンマで分割してカウント
                return acc;
              },
              {}
            );

            setApplicantCounts(counts); // 応募者数をステートに保存
          } else {
            setError("データが見つかりませんでした。");
          }
        } catch (err) {
          setError("データの取得中にエラーが発生しました。");
          console.error(err);
        } finally {
          setLoading(false);
        }
      } else {
        // ユーザーが認証されていない場合
        setError("ユーザーがログインしていません。");
        setLoading(false);
      }
    });

    // コンポーネントがアンマウントされたときに監視を解除
    return () => unsubscribe();
  }, []);

  const handleDelete = async (projectID) => {
    if (window.confirm("このプロジェクトを削除しますか？")) {
      try {
        // Firebaseからプロジェクトを削除
        const projectRef = ref(database, `projects/${projectID}`);
        const applicationRef = ref(database, `applications/${projectID}`);

        await Promise.all([remove(projectRef), remove(applicationRef)]);

        // ローカル状態から削除
        setProjects((prevProjects) =>
          prevProjects.filter((project) => project.projectID !== projectID)
        );

        alert("プロジェクトが削除されました。");
      } catch (err) {
        console.error(err);
        alert("プロジェクトの削除中にエラーが発生しました。");
      }
    }
  };

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
          secondaryColor="#fa2900"
          radius={12.5}
          ariaLabel="loading"
          wrapperStyle={{}}
          wrapperClass=""
          visible={true}
        />
      </div>
    );
  }
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>現在募集中のプロジェクト</h1>
      {projects.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
          {projects.map((project, index) => (
            <div
              key={index}
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "15px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                maxWidth: "300px",
                backgroundColor: "#fff",
              }}
              onClick={() => handleDelete(project.projectID)}
            >
              <h3 style={{ margin: "0 0 10px" }}>{project.title || "N/A"}</h3>
              <p>
                <strong>プロジェクトID:</strong> {project.projectID} <br />
                <strong>締切:</strong>{" "}
                {new Date(project.deadline).toLocaleString() || "N/A"} <br />
                <strong>納品日:</strong>{" "}
                {new Date(project.deliveryDate).toLocaleString() || "N/A"}{" "}
                <br />
                <strong>担当者:</strong> {project.finalMan || "N/A"} <br />
                <strong>報酬:</strong> {project.reward || "N/A"}円 <br />
                <strong>ボーナス:</strong> {project.bonus || "N/A"}円 <br />
                <strong>罰金:</strong> {project.penalty || "N/A"}円 <br />
                <strong>応募者情報:</strong>{" "}
                {applicantCounts[project.projectID] || 0} 人
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p>現在、募集中のプロジェクトはありません。</p>
      )}
      {/* 戻るボタン */}
      <button
        onClick={handleBack}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "#007BFF",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        戻る
      </button>
    </div>
  );
}
