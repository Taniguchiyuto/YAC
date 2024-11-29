"use client";

import { useEffect, useState } from "react";
import { ref, get, remove } from "firebase/database";
import { database } from "../../../firebase.js";
import { useRouter } from "next/navigation";

export default function ActiveProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applicantCounts, setApplicantCounts] = useState({}); // 応募者数を保持

  const handleBack = () => {
    router.push("/success");
  };

  const generateShift = () => {
    router.push("/projects/shift/generated");
    // シフト生成のロジックをここに実装
  };

  useEffect(() => {
    const fetchProjectsAndApplications = async () => {
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

          // projectsとapplicationsをマッチさせる
          const matchedProjects = Object.keys(projectsData).reduce(
            (result, projID) => {
              if (applicationsData[projID]) {
                result.push({
                  ...projectsData[projID],
                });
              }
              return result;
            },
            []
          );

          setProjects(matchedProjects); // マッチしたプロジェクトを保存

          // 各プロジェクトの応募者数をカウント
          const counts = Object.keys(applicationsData).reduce((acc, projID) => {
            const applicatorIDs = applicationsData[projID].applicatorID || "";
            const applicatorIDArray = applicatorIDs.split(","); // カンマで分割
            acc[projID] = applicatorIDArray.length; // 配列の長さをカウント
            return acc;
          }, {});

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
    };

    fetchProjectsAndApplications();
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

  if (loading) return <p>読み込み中...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  // 現在の日時と締切日の差を計算
  const oneWeekFromNow = new Date();
  oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
  const today = new Date(); // 今日の日付を取得
  //1週間以内のもので、かつprojectの担当者が未定のもののみ抽出
  const projectsWithinOneWeek = projects.filter((project) => {
    const deliveryDate = new Date(project.deliveryDate); //deliveryDateをDataオブジェクトに変換
    return (
      deliveryDate >= today &&
      deliveryDate <= oneWeekFromNow &&
      project.finalMan == "未定"
    ); //今日以降かつ1週間以内
  });

  //今週

  const projectsBeyondOneWeek = projects.filter(
    (project) =>
      new Date(project.deliveryDate) > oneWeekFromNow && //締切が1週間以上先
      project.finalMan === "未定" ///　担当者が未定
  );

  return (
    <div style={{ padding: "20px" }}>
      <h1>現在募集中のプロジェクト</h1>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* 1週間以内のプロジェクト */}
        <h2>締切が1週間以内のプロジェクト</h2>
        {/* シフト生成ボタン */}
        <button
          onClick={generateShift}
          style={{
            padding: "10px 20px",
            backgroundColor: "#28a745",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          シフトを生成
        </button>
      </div>
      {projectsWithinOneWeek.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
          {projectsWithinOneWeek.map((project, index) => (
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
                <strong>素材提供予定日:</strong>{" "}
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
        <p>1週間以内に締切のプロジェクトはありません。</p>
      )}

      {/* 1週間以降のプロジェクト */}
      <h2>締切が1週間以降のプロジェクト</h2>
      {projectsBeyondOneWeek.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
          {projectsBeyondOneWeek.map((project, index) => (
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
        <p>1週間以降に締切のプロジェクトはありません。</p>
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
