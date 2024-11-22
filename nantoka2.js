import { ref, set } from "firebase/database";
import { database } from "./firebase.js";

const editorData1 = {
  id: 1,
  editorID: "editor123",
  nickName: "Yuto",
};

const projectData1 = {
  projectID: "proj1",
  title: "(見本)ブルーロック最新話まとめ",
  deadline: "2024-12-15T00:00:00Z",
  deliveryDate: "2024-12-10T00:00:00Z",
  reward: 1000,
  penalty: 100,
  status: "open",
  candidate: ["editor123"],
  finalMan: "editor123",
};

const applicationData1 = {
  applicationID: "app1",
  projectID: "proj1",
  applicatorID: "editor123",
  applicationDate: "2023-12-15T00:00:00Z",
  status: "pending",
  nickName: "Yuto",
};

const performanceData1 = {
  id: 1,
  editorID: `editor123`,
  title: "Project A",
  review: 4000,
  likeRate: 4.5,
  genre: "Technology",
  dueCheck: "on-time",
  bonus: 100,
  penalty: 0,
  totalMoney: 1100,
  nickName: "Yuto",
};

const finalSelectionData1 = {
  id: 1,
  projectID: "proj1",
  editorID: "editor123",
  reason: "High quality work",
  title: "Sample Project",
};

// Firebaseにデータを保存
async function saveData() {
  try {
    // Editorデータを保存
    await set(ref(database, "editors/editor123"), editorData1);
    console.log("Editor data saved.");

    // Projectデータを保存
    await set(ref(database, "projects/proj1"), projectData1);
    console.log("Project data saved.");

    // Applicationデータを保存
    await set(ref(database, "applications/app1"), applicationData1);
    console.log("Application data saved.");

    // Performanceデータを保存
    await set(ref(database, "performances/performance1"), performanceData1);
    console.log("Performance data saved.");

    // FinalSelectionデータを保存
    await set(
      ref(database, "finalSelections/finalSelection1"),
      finalSelectionData1
    );
    console.log("Final Selection Data saved.");
  } catch (error) {
    console.error("Error saving data:", error);
  } finally {
  }
}

saveData();
