"use client"; // クライアントサイドコンポーネントとして指定

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import { useRouter } from "next/navigation"; // useRouterをインポート
import { ref, get, update } from "firebase/database";
import { database } from "../../../firebase.js"; // Firebase 初期化済みインスタンス
import { MutatingDots } from "react-loader-spinner";
export default function ChatPage() {
  const router = useRouter(); // useRouterの初期化
  const [uid, setUid] = useState(null); // UID の状態を管理
  const [response, setResponse] = useState("");
  const [applications, setApplications] = useState([]);
  const [performances, setPerformances] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false); // handleSubmitが呼ばれたかどうかを追跡するフラグ

  // 初回レンダリング時にデータを取得
  // 初回レンダリング時にUIDを取得
  useEffect(() => {
    const fetchUID = () => {
      const auth = getAuth();

      // 認証状態を監視してUIDを取得
      onAuthStateChanged(auth, (user) => {
        if (user) {
          console.log("ログイン中のユーザー:", user.uid);
          setUid(user.uid); // UID を設定
        } else {
          console.error("ユーザーはログインしていません");
          router.push("/login"); // ログインページにリダイレクト
        }
      });
    };

    fetchUID();
  }, []);
  // 空依存配列で初回のみ実行
  // UIDが取得された後にfetchFirebaseDataを実行
  useEffect(() => {
    if (uid) {
      fetchFirebaseData(uid); // UIDを渡してデータ取得
    }
  }, [uid]); // uid が変更されたときに実行
  // Firebase からデータを取得する関数
  const fetchFirebaseData = async () => {
    try {
      // Firebase Authentication から現在のユーザーを取得
      console.log("突破");
      const applicationsRef = ref(database, "applications");
      const applicationsSnapshot = await get(applicationsRef);

      if (applicationsSnapshot.exists()) {
        const rawApplications = Object.entries(applicationsSnapshot.val()).map(
          ([key, value]) => ({
            id: key,
            ...value,
          })
        );

        const today = new Date(); //今日の日付
        const oneWeekLater = new Date(
          today.getTime() + 7 * 24 * 60 * 60 * 1000
        );
        const filteredApplications = rawApplications
          .filter((app) => {
            const applicationDate = new Date(app.applicationDate);
            return (
              app.status === "open" && // status が "open"
              app.applicatorID !== null && // applicatorID が null ではない
              app.applicatorID.trim() !== "" && // 空文字列または空白文字列だけを除外
              applicationDate <= oneWeekLater // 募集日が1週間以内
            );
          })
          .map((app) => ({
            applicationID: app.id,
            projectID: app.projectID || null,
            applicatorID: app.applicatorID || null,
          }));

        setApplications(filteredApplications);
        console.log("Filtered Applications:", filteredApplications);
        if (filteredApplications.length === 0) {
          console.warn("Filtered Applications is empty. Redirecting...");
          router.push("/success"); // 別のページにリダイレクト
        } else {
          setApplications(filteredApplications);
          console.log("Filtered Applications:", filteredApplications);
        }
      } else {
        setApplications([]);
        router.push("/success");
      }

      const performancesRef = ref(database, "performances");
      const performancesSnapshot = await get(performancesRef);
      if (performancesSnapshot.exists()) {
        const rawperformances = Object.entries(performancesSnapshot.val()).map(
          ([key, value]) => ({
            id: key,
            ...value,
          })
        );

        const filteredperformances = rawperformances.map((app) => ({
          id: app.id,
          performances_duecheck: app.dueStatus,
          performances_editorID: app.editorID,
          performances_genre: app.genre,
          performances_likeRate: app.likeRate + "%",
          performances_review: app.view + "回再生",
          performances_title: app.title,
          performances_editorName: app.nickName || null,
        }));

        setPerformances(filteredperformances);
        console.log(filteredperformances);
      } else {
        setPerformances([]);
      }

      const projectsRef = ref(database, "projects");
      const projectsSnapshot = await get(projectsRef);

      if (projectsSnapshot.exists()) {
        const rawProjects = Object.entries(projectsSnapshot.val()).map(
          ([key, value]) => ({
            id: key,
            ...value,
          })
        );

        const today = new Date();

        const filteredProjects = rawProjects
          .filter((proj) => {
            if (!proj.deliveryDate) return false;
            const deliveryDate = new Date(proj.deliveryDate);
            return (
              deliveryDate <=
                new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) &&
              proj.status == "open"
            );
          })
          .map((proj) => ({
            id: proj.projectID,
            deliveryDate: proj.deliveryDate + "(素材提供日)",
            deadline: proj.deadline,
            title: proj.title,
          }));

        setProjects(filteredProjects);
        console.log("Filtered Projects:", filteredProjects);
      } else {
        setProjects([]);
        router.push("/success");
      }
    } catch (error) {
      console.error("Error fetching data from Firebase:", error);
    }
  };

  // 状態が更新された後に適切な処理を実行
  useEffect(() => {
    if (
      applications.length > 0 &&
      performances.length > 0 &&
      projects.length > 0 &&
      !isSubmitted
    ) {
      handleSubmit();
    }
  }, [applications, performances, projects, isSubmitted]); // 依存配列にisSubmittedを追加

  const handleSubmit = async () => {
    setIsSubmitted(true); // handleSubmitを実行したことをフラグで管理
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("No user is authenticated");
      return;
    }

    console.log("Authenticated user UID", currentUser.uid);

    const userInput = `
performancesの成績を元に、適切なeditorIDの値をapplicatorIDの中から担当者を選んでください。applicatorIDではないものからは選ばないでください。結果は次の形式で返してください
{
  "assignments": [
    { "projectID": "proj18", "editorID": "editor1" },
    { "projectID": "proj19", "editorID": "editor2" },
    ...
  ]
}`;

    try {
      const promptData = {
        userPrompt: userInput,
        applications,
        performances,
        projects,
      };
      console.log("Promptdata", promptData);
      // API へプロンプトを送信
      const res = await fetch("/api/generateshift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptData }),
      });

      let data = await res.json();

      let parsedMessage;
      if (data.message) {
        try {
          parsedMessage = JSON.parse(data.message);
        } catch (parseError) {
          console.error("Error parsing message:", parseError);
          setResponse("Error parsing message");
          return;
        }
      }

      if (
        parsedMessage &&
        parsedMessage.assignments &&
        Array.isArray(parsedMessage.assignments)
      ) {
        console.log("Assignments data received:", parsedMessage.assignments);

        const updates = {};
        parsedMessage.assignments.forEach(async ({ projectID, editorID }) => {
          if (projectID && editorID) {
            updates[`projects/${projectID}/finalMan`] = editorID;
            updates[`projects/${projectID}/status`] = "closed";
            updates[`applications/${projectID}/status`] = "closed";

            const res = await fetch("/api/test", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ uid: editorID }),
            });

            if (!res.ok) {
              throw new Error(`ユーザー情報取得に失敗しました!: ${res.status}`);
            }

            const data = await res.json();
            const email = data.email;

            // // Firebase `projects` ノードからタイトルを取得
            // const projectTitleRef = ref(
            //   database,
            //   `projects/${projectID}/title`
            // ); // projectsノード内の特定プロジェクトのtitleを参照
            // const projectTitleSnapshot = await get(projectTitleRef); // Firebaseからデータを取得
            // if (projectTitleSnapshot.exists()) {
            //   projectTitle = projectTitleSnapshot.val(); // 取得したtitleをprojectTitleに代入
            // } else {
            //   console.error(
            //     `プロジェクトタイトルが見つかりません: ${projectID}`
            //   ); // titleが存在しない場合のエラーログ
            // }

            if (email) {
              const mailResponse = await fetch("/api/tests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: email,
                  subject: `Project Assignment: ${projectID}`,
                  body: `You have been assigned to project ID: ${projectID}. Please check the system for further details.`,
                }),
              });

              if (mailResponse.ok) {
                console.log(`メールを送信しました: ${email}`);
              } else {
                console.error(
                  `メール送信に失敗しました: ${email}`,
                  await mailResponse.text()
                );
              }
            } else {
              console.error(
                `UID: ${editorID} に対応するメールアドレスが見つかりません`
              );
            }
          } else {
            console.error(`データが不足しています`);
          }
        });

        const databaseRef = ref(database);
        await update(databaseRef, updates);

        setResponse("Assignments processed and database updated successfully");
        router.push("/success");
      } else {
        console.error(
          "Assignments data not found in parsed message:",
          parsedMessage
        );
        setResponse("Invalid response format");
      }
    } catch (error) {
      console.error("Error sending prompt or processing response:", error);
      setResponse("Error occurred while processing");
    }
  };

  return (
    <div
      style={{
        display: "flex", //フレックスボックスを有効化
        justifyContent: "center", //水平方向中央揃え
        alignItems: "center", //垂直方向中央揃え
        height: "100vh", //ビューポート全体の高さを確保
        backgroundColor: "#f9f9f9", //必要に応じて背景色を設定
      }}
    >
      <MutatingDots
        height={100} //スピナーの高さ
        width={100} //スピナーの幅
        color="#4fa94d" //メインの色
        secondaryColor="#f2a900" //セカンダリー色
        radius={12.5} //ドットの半径
        ariaLabel="loading"
        visible={true} //表示状態を維持
      />
    </div>
  );
}
