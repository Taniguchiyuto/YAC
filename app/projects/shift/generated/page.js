"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // useRouterをインポート
import { ref, get, update } from "firebase/database";
import { database } from "../../../../firebase.js"; // Firebase 初期化済みインスタンス

export default function ChatPage() {
  const router = useRouter(); // useRouterの初期化
  const [response, setResponse] = useState("");
  const [applications, setApplications] = useState([]);
  const [performances, setPerformances] = useState([]);
  const [projects, setProjects] = useState([]);

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

        const filteredApplications = rawApplications
          .filter((app) => app.status === "open")
          .map((app) => ({
            applicationID: app.id,
            projectID: app.projectID || null,
            applicatorID: app.applicatorID || null,
          }));

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

        const filteredperformances = rawperformances.map((app) => ({
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
        const filteredProjects = rawProjects
          .filter((proj) => {
            if (!proj.deliveryDate) return false;
            const deliveryDate = new Date(proj.deliveryDate);
            return (
              deliveryDate >= today &&
              deliveryDate <=
                new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
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

  const handleSubmit = async () => {
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
        parsedMessage.assignments.forEach(({ projectID, editorID }, index) => {
          if (projectID && editorID) {
            updates[`projects/${projectID}/finalMan`] = editorID;
            updates[`projects/${projectID}/status`] = "closed"; // statusをclosedに設定
          } else {
            console.error(`Missing data in assignment ${index + 1}:`, {
              projectID,
              editorID,
            });
          }
        });

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
  useEffect(() => {
    fetchFirebaseData().then(() => {
      handleSubmit(); // データ取得後にhandleSubmitを実行
    });
  }, []); // 空依存配列で1回のみ実行

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
