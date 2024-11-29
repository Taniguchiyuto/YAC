"use client";

import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { useRouter } from "next/navigation"; // useRouterをインポート
import { ref, get, update } from "firebase/database";
import { database } from "../../../../firebase.js"; // Firebase 初期化済みインスタンス

export default function ChatPage() {
  const router = useRouter(); // useRouterの初期化
  const [response, setResponse] = useState("");
  const [applications, setApplications] = useState([]);
  const [performances, setPerformances] = useState([]);
  const [projects, setProjects] = useState([]);
  // 関数の存在を確認

  // 初回レンダリング時にデータを取得
  useEffect(() => {
    fetchFirebaseData();
  }, []); // 空依存配列で初回のみ実行

  // Firebase からデータを取得する関数
  const fetchFirebaseData = async () => {
    try {
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
            // 募集日を Date オブジェクトに変換
            const applicationDate = new Date(app.applicationDate);

            // すべての条件を AND で結合して return
            return (
              app.status === "open" && // status が "open"
              app.applicatorID !== null && // applicatorID が null ではない
              app.applicatorID.trim() !== "" && //空文字列または空白文字列だけを除外
              applicationDate <= oneWeekLater // 募集日が1週間以内
            );
          })

          .map((app) => ({
            applicationID: app.id,
            projectID: app.projectID || null,
            applicatorID: app.applicatorID || null,
          }));

        console.log(filteredApplications);

        setApplications(filteredApplications);
      } else {
        setApplications([]);
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

        const filteredperformances = rawperformances
          // .filter((app) => {
          //   ///statusがopen
          //   return app.status === open;
          // })
          .map((app) => ({
            id: app.id,
            performances_duecheck: app.dueCheck,
            performances_editorID: app.editorID,
            performances_genre: app.genre,
            performances_likeRate: app.likeRate + "%",
            performances_review: app.review + "回再生",
            performances_title: app.title,
            performances_editorName: app.nickName || null,
          }));

        setPerformances(filteredperformances);
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

        //Projectをfilterにかけて、statusがopen
        const filteredProjects = rawProjects
          .filter((proj) => {
            if (!proj.deliveryDate) return false;
            const deliveryDate = new Date(proj.deliveryDate);
            return (
              // deliveryDate >= today &&
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
      } else {
        setProjects([]);
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
      projects.length > 0
    ) {
      handleSubmit();
    }
  }, [applications, performances, projects]); // これらの状態が更新されたら実行

  const handleSubmit = async () => {
    //Firebase Authenticationのインスタンスを取得
    const auth = getAuth();
    //現在ログイン中のユーザーを取得
    const currentUser = auth.currentUser;
    //ユーザーがログインしているか確認
    if (!currentUser) {
      console.error("No user is authenticated");
      return;
    }

    //ログイン中のユーザーのUIDをコンソールに出力
    console.log("Authenticated user UID", currentUser.uid);

    //ユーザーのメールアドレスをコンソールに出力(オプション)
    console.log("Authenticated user email;", currentUser.email);

    const userInput = `
以下のデータを基にプロジェクト担当を調整してください。結果は次の形式で返してください：
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

      const res = await fetch("/api/generateshift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptData }),
      });

      let data = await res.json();

      console.log("Received raw data:", data);

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
        parsedMessage.assignments.forEach(
          async ({ projectID, editorID }, index) => {
            if (projectID && editorID) {
              updates[`projects/${projectID}/finalMan`] = editorID;
              updates[`projects/${projectID}/status`] = "closed";
              updates[`applications/${projectID}/status`] = "closed";

              try {
                // APIを呼び出してメールアドレスを取得
                console.log("editorID:", editorID); // 確認用

                const res = await fetch("/api/test", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ uid: editorID }), // UIDを渡す
                });

                if (!res.ok) {
                  throw new Error(
                    `ユーザー情報取得に失敗しました: ${res.status}`
                  );
                }

                const data = await res.json();
                console.log(data);
                const email = data.email;

                if (email) {
                  // メール送信
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
              } catch (error) {
                console.error(
                  `UID: ${editorID} の処理中にエラーが発生しました:`,
                  error
                );
              }
            } else {
              console.error(`データが不足しています: ${index + 1}`, {
                projectID,
                editorID,
              });
            }
          }
        );

        const databaseRef = ref(database);
        await update(databaseRef, updates);

        console.log("Projects successfully updated in Firebase:", updates);

        setResponse("Assignments processed and database updated successfully");
        router.push("/success"); // 成功したら "/success" ページにリダイレクト
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

  // ページがレンダリングされたら `handleSubmit` を実行
  // 空依存配列で1回のみ実行

  return (
    <div>
      <h1>Chat with GPT</h1>

      <p>Response: {response}</p>

      <h2>Applications Data</h2>
      <ul>
        {applications.map((app) => (
          <li key={app.applicationID}>
            <strong>Project ID:</strong> {app.projectID} <br />
            <strong>Applicator ID:</strong> {app.applicatorID}
          </li>
        ))}
      </ul>

      <h2>Performances Data</h2>
      <ul>
        {performances.map((perf) => (
          <li key={perf.id}>
            <strong>ID:</strong> {perf.id} <br />
            <strong>Data:</strong> {JSON.stringify(perf, null, 2)}
          </li>
        ))}
      </ul>

      <h2>Projects Data</h2>
      <ul>
        {projects.map((proj) => (
          <li key={proj.id}>
            <strong>ID:</strong> {proj.id} <br />
            <strong>Data:</strong> {JSON.stringify(proj, null, 2)}
          </li>
        ))}
      </ul>
    </div>
  );
}
