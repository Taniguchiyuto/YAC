// "use client"; // クライアントサイドコンポーネントとして指定

// import { useState, useEffect } from "react";
// import { getAuth } from "firebase/auth";
// import { useRouter } from "next/navigation"; // useRouterをインポート
// import { ref, get, update } from "firebase/database";
// import { database } from "../../../../firebase.js"; // Firebase 初期化済みインスタンス

// export default function ChatPage() {
//   const router = useRouter(); // useRouterの初期化
//   const [response, setResponse] = useState("");
//   const [applications, setApplications] = useState([]);
//   const [performances, setPerformances] = useState([]);
//   const [projects, setProjects] = useState([]);
//   const [isSubmitted, setIsSubmitted] = useState(false); // handleSubmitが呼ばれたかどうかを追跡するフラグ
//   const [uid, setUid] = useState(null); // 現在ログインしているユーザーのUIDを保存
//   const auth = getAuth();
//   const currentUser = auth.currentUser;

//   if (currentUser) {
//     setUid(currentUser.uid);
//     console.log("現在のUID:", currentUser.uid);
//   } else {
//     console.error("ユーザーはログインしていません");
//   }
//   // 初回レンダリング時にデータを取得
//   useEffect(() => {
//     fetchFirebaseData();
//     const currentUser = auth.currentUser;

//     if (currentUser) {
//       setUid(currentUser.uid);
//       console.log("現在のUID:", currentUser.uid);
//     } else {
//       console.error("ユーザーはログインしていません");
//     }
//   }, []); // 空依存配列で初回のみ実行

//   // Firebase からデータを取得する関数
//   const fetchFirebaseData = async () => {
//     try {
//       const auth = getAuth();
//       const currentUser = auth.currentUser;

//       if (!currentUser) {
//         console.error("ユーザーはログインしていません");
//         throw new Error("ログインが必要です");
//       }

//       const uid = currentUser.uid;
//       console.log("現在のUID:", uid);

//       // Applications の取得とフィルタリング
//       const applicationsRef = ref(database, "applications");
//       const applicationsSnapshot = await get(applicationsRef);

//       if (applicationsSnapshot.exists()) {
//         const rawApplications = Object.entries(applicationsSnapshot.val()).map(
//           ([key, value]) => ({ id: key, ...value })
//         );

//         const today = new Date();
//         const oneWeekLater = new Date(
//           today.getTime() + 7 * 24 * 60 * 60 * 1000
//         );

//         const filteredApplications = rawApplications
//           .filter((app) => {
//             const applicationDate = new Date(app.applicationDate);
//             return (
//               app.status === "open" &&
//               app.applicatorID &&
//               app.applicatorID.trim() !== "" &&
//               applicationDate <= oneWeekLater &&
//               app.Planner === uid
//             );
//           })
//           .map((app) => ({
//             applicationID: app.id,
//             projectID: app.projectID || null,
//             applicatorID: app.applicatorID || null,
//           }));

//         setApplications(filteredApplications);
//         if (filteredApplications.length === 0) {
//           throw new Error("条件に一致するプロジェクトが見つかりませんでした");
//         }
//       } else {
//         throw new Error("アプリケーションデータが存在しません");
//       }

//       // Performances の取得と処理
//       const performancesRef = ref(database, "performances");
//       const performancesSnapshot = await get(performancesRef);

//       if (performancesSnapshot.exists()) {
//         const rawPerformances = Object.entries(performancesSnapshot.val()).map(
//           ([key, value]) => ({ id: key, ...value })
//         );

//         const filteredPerformances = rawPerformances.map((app) => ({
//           id: app.id,
//           performances_duecheck: app.dueCheck,
//           performances_editorID: app.editorID,
//           performances_genre: app.genre,
//           performances_likeRate: `${app.likeRate}%`,
//           performances_review: `${app.review}回再生`,
//           performances_title: app.title,
//           performances_editorName: app.nickName || null,
//         }));

//         setPerformances(filteredPerformances);
//       } else {
//         setPerformances([]);
//       }

//       // Projects の取得と処理
//       const projectsRef = ref(database, "projects");
//       const projectsSnapshot = await get(projectsRef);

//       if (projectsSnapshot.exists()) {
//         const rawProjects = Object.entries(projectsSnapshot.val()).map(
//           ([key, value]) => ({ id: key, ...value })
//         );

//         const today = new Date();
//         const oneWeekLater = new Date(
//           today.getTime() + 7 * 24 * 60 * 60 * 1000
//         );

//         const filteredProjects = rawProjects
//           .filter((proj) => {
//             if (!proj.deliveryDate) return false;
//             const deliveryDate = new Date(proj.deliveryDate);
//             return deliveryDate <= oneWeekLater && proj.status === "open";
//           })
//           .map((proj) => ({
//             id: proj.projectID,
//             deliveryDate: `${proj.deliveryDate}(素材提供日)`,
//             deadline: proj.deadline,
//             title: proj.title,
//           }));

//         setProjects(filteredProjects);
//         if (filteredProjects.length === 0) {
//           console.warn("条件に一致するプロジェクトが見つかりませんでした");
//         }
//       } else {
//         setProjects([]);
//       }
//     } catch (error) {
//       console.error("Error fetching data from Firebase:", error.message);
//       setTimeout(() => {
//         router.push("/error"); // 必要に応じてエラーページにリダイレクト
//       }, 3000);
//     }
//   };

//   // 状態が更新された後に適切な処理を実行
//   useEffect(() => {
//     if (
//       applications.length > 0 &&
//       performances.length > 0 &&
//       projects.length > 0 &&
//       !isSubmitted
//     ) {
//       handleSubmit();
//     }
//   }, [applications, performances, projects, isSubmitted]); // 依存配列にisSubmittedを追加

//   const handleSubmit = async () => {
//     setIsSubmitted(true); // handleSubmitを実行したことをフラグで管理
//     const auth = getAuth();
//     const currentUser = auth.currentUser;
//     if (!currentUser) {
//       console.error("No user is authenticated");
//       return;
//     }

//     console.log("Authenticated user UID", currentUser.uid);

//     const userInput = `
// 以下のデータを基にプロジェクト担当を調整してください。結果は次の形式で返してください：
// {
//   "assignments": [
//     { "projectID": "proj18", "editorID": "editor1" },
//     { "projectID": "proj19", "editorID": "editor2" },
//     ...
//   ]
// }`;

//     try {
//       const promptData = {
//         userPrompt: userInput,
//         applications,
//         performances,
//         projects,
//       };

//       const res = await fetch("/api/generateshift", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ prompt: promptData }),
//       });

//       let data = await res.json();

//       let parsedMessage;
//       if (data.message) {
//         try {
//           parsedMessage = JSON.parse(data.message);
//         } catch (parseError) {
//           console.error("Error parsing message:", parseError);
//           setResponse("Error parsing message");
//           return;
//         }
//       }

//       if (
//         parsedMessage &&
//         parsedMessage.assignments &&
//         Array.isArray(parsedMessage.assignments)
//       ) {
//         console.log("Assignments data received:", parsedMessage.assignments);

//         const updates = {};
//         parsedMessage.assignments.forEach(async ({ projectID, editorID }) => {
//           if (projectID && editorID) {
//             updates[`projects/${projectID}/finalMan`] = editorID;
//             updates[`projects/${projectID}/status`] = "closed";
//             updates[`applications/${projectID}/status`] = "closed";

//             const res = await fetch("/api/test", {
//               method: "POST",
//               headers: { "Content-Type": "application/json" },
//               body: JSON.stringify({ uid: editorID }),
//             });

//             if (!res.ok) {
//               throw new Error(`ユーザー情報取得に失敗しました: ${res.status}`);
//             }

//             const data = await res.json();
//             const email = data.email;

//             if (email) {
//               const mailResponse = await fetch("/api/tests", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({
//                   email: email,
//                   subject: `Project Assignment: ${projectID}`,
//                   body: `You have been assigned to project ID: ${projectID}. Please check the system for further details.`,
//                 }),
//               });

//               if (mailResponse.ok) {
//                 console.log(`メールを送信しました: ${email}`);
//               } else {
//                 console.error(
//                   `メール送信に失敗しました: ${email}`,
//                   await mailResponse.text()
//                 );
//               }
//             } else {
//               console.error(
//                 `UID: ${editorID} に対応するメールアドレスが見つかりません`
//               );
//             }
//           } else {
//             console.error(`データが不足しています`);
//           }
//         });

//         const databaseRef = ref(database);
//         await update(databaseRef, updates);

//         setResponse("Assignments processed and database updated successfully");
//         router.push("/success");
//       } else {
//         console.error(
//           "Assignments data not found in parsed message:",
//           parsedMessage
//         );
//         setResponse("Invalid response format");
//       }
//     } catch (error) {
//       console.error("Error sending prompt or processing response:", error);
//       setResponse("Error occurred while processing");
//     }
//   };

//   return (
//     <div>
//       <h1>Chat with GPT</h1>

//       <p>Response: {response}</p>

//       <h2>Applications Data</h2>
//       <ul>
//         {applications.map((app) => (
//           <li key={app.applicationID}>
//             <strong>Project ID:</strong> {app.projectID} <br />
//             <strong>Applicator ID:</strong> {app.applicatorID}
//           </li>
//         ))}
//       </ul>

//       <h2>Performances Data</h2>
//       <ul>
//         {performances.map((perf) => (
//           <li key={perf.id}>
//             <strong>ID:</strong> {perf.id} <br />
//             <strong>Data:</strong> {JSON.stringify(perf, null, 2)}
//           </li>
//         ))}
//       </ul>

//       <h2>Projects Data</h2>
//       <ul>
//         {projects.map((proj) => (
//           <li key={proj.id}>
//             <strong>ID:</strong> {proj.id} <br />
//             <strong>Data:</strong> {JSON.stringify(proj, null, 2)}
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }
