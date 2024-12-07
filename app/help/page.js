"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { ref, get, set, update } from "firebase/database";
import { database } from "../../firebase.js";
import { useRouter } from "next/navigation";
import { MutatingDots } from "react-loader-spinner";

export default function ActiveProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applicantCounts, setApplicantCounts] = useState({});
  const [videoGenre, setVideoGenre] = useState(""); // 動画ジャンルの状態を管理
  const [dueCheck, setDueCheck] = useState(false); // 期限チェックの状態を管理

  const [selectedProjectID, setSelectedProjectID] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [youtubeURL, setYoutubeURL] = useState("");
  const [videoTitle, setVideoTitle] = useState(""); // 動画タイトルの状態を管理
  const [likeRate, setLikeRate] = useState(null); // いいね率の状態を管理

  const handleBack = () => {
    router.push("/success/job/");
  };

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const projectsRef = ref(database, "projects");
          const applicationsRef = ref(database, "applications");

          const [projectsSnapshot, applicationsSnapshot] = await Promise.all([
            get(projectsRef),
            get(applicationsRef),
          ]);

          if (projectsSnapshot.exists() && applicationsSnapshot.exists()) {
            const projectsData = projectsSnapshot.val();
            const applicationsData = applicationsSnapshot.val();

            const matchedProjects = Object.keys(projectsData)
              .map((projID) => ({
                ...projectsData[projID],
                projectID: projID,
              }))
              .filter(
                (project) =>
                  project.Planner && project.Planner === currentUser.uid
              );

            setProjects(matchedProjects);

            const counts = Object.keys(applicationsData).reduce(
              (acc, projID) => {
                const applicators = applicationsData[projID].applicatorID || "";
                acc[projID] = applicators.split(",").filter(Boolean).length;
                return acc;
              },
              {}
            );

            setApplicantCounts(counts);
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
        setError("ユーザーがログインしていません。");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // YouTube URLから動画IDを抽出する関数
  const extractVideoId = (url) => {
    const regex =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // YouTube APIを使って動画タイトルといいね率を取得し、performancesテーブルに更新する関数
  const fetchVideoData = async () => {
    const videoId = extractVideoId(youtubeURL);
    if (!videoId) {
      alert("有効なYouTube URLを入力してください。");
      return;
    }

    const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY; // 環境変数からキーを取得
    const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${API_KEY}`;
    const categoriesUrl = `https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&regionCode=JP&key=${API_KEY}`;

    try {
      // 動画情報を取得
      const videoResponse = await fetch(videoUrl);
      if (!videoResponse.ok) {
        throw new Error("YouTube APIリクエストが失敗しました");
      }
      const videoData = await videoResponse.json();

      if (videoData.items.length > 0) {
        const videoSnippet = videoData.items[0].snippet;
        const videoStatistics = videoData.items[0].statistics;
        const videoCategoryId = videoSnippet.categoryId;

        // 動画タイトルと統計情報を取得
        const newVideoTitle = videoSnippet.title;
        const newViewCount = parseInt(videoStatistics.viewCount, 10);
        const newLikeCount = parseInt(videoStatistics.likeCount, 10);

        setVideoTitle(newVideoTitle);

        // いいね率を計算
        if (newViewCount > 0) {
          const calculatedLikeRate = (
            (newLikeCount / newViewCount) *
            100
          ).toFixed(2);
          setLikeRate(calculatedLikeRate);
        } else {
          setLikeRate(0);
        }

        // ジャンルを取得
        const categoriesResponse = await fetch(categoriesUrl);
        if (!categoriesResponse.ok) {
          throw new Error("YouTubeジャンルの取得に失敗しました");
        }
        const categoriesData = await categoriesResponse.json();
        const category = categoriesData.items.find(
          (item) => item.id === videoCategoryId
        );
        const genreName = category ? category.snippet.title : "不明";
        setVideoGenre(genreName);

        // Firebaseにデータを更新
        if (selectedProjectID && selectedProject) {
          const performanceRef = ref(
            database,
            `performances/${selectedProjectID}`
          );

          // dueCheck の値を文字列として保存
          const dueStatus = dueCheck ? "on-time" : "delay";

          await update(performanceRef, {
            title: newVideoTitle,
            view: newViewCount, // 再生回数を保存
            likeRate: likeRate,
            genre: genreName, // ジャンルを保存
            dueStatus: dueStatus, // 期限の状態を保存
            editorID: selectedProject.finalMan,
          });

          alert(
            `動画情報（タイトル、いいね率、ジャンル、期限: ${dueStatus}）がFirebaseに更新されました。`
          );
          setYoutubeURL("");
        }
      } else {
        alert("動画が見つかりませんでした。");
      }
    } catch (err) {
      console.error(err);
      alert("データの取得中にエラーが発生しました。");
    }
  };

  // 削除ボタンがクリックされたときに呼ばれる関数
  const handleDelete = (projectID) => {
    const project = projects.find((proj) => proj.projectID === projectID);
    setSelectedProjectID(projectID);
    setSelectedProject(project);
    setIsModalOpen(true);
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
      <h1>これまでのプロジェクト</h1>
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

      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
              maxWidth: "400px",
              textAlign: "center",
            }}
          >
            <h2>パフォーマンスの入力</h2>

            <input
              type="text"
              value={youtubeURL}
              onChange={(e) => setYoutubeURL(e.target.value)}
              placeholder="YouTubeのURLを入力してください"
              style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
            />
            <button
              onClick={fetchVideoData}
              style={{
                padding: "10px 20px",
                backgroundColor: "#007BFF",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                marginBottom: "10px",
              }}
            >
              動画情報を取得
            </button>
            {videoTitle && <p>動画タイトル: {videoTitle}</p>}
            {likeRate !== null && <p>いいね率: {likeRate}%</p>}

            <div style={{ marginTop: "10px", textAlign: "left" }}>
              <label>
                <input
                  type="checkbox"
                  checked={dueCheck}
                  onChange={(e) => setDueCheck(e.target.checked)}
                  style={{ marginRight: "8px" }}
                />
                期限を守った
              </label>
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                padding: "10px 20px",
                backgroundColor: "#6c757d",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                marginTop: "10px",
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
