// insertGrapeData.js
import { ref, update } from "firebase/database";
import { database } from "./firebase.js"; // firebase.jsのパスに応じて変更

async function insertGrapeData() {
  try {
    await update(ref(database, "fruits"), {
      grape1: {
        color: "purple",
        origin: "Italy",
        varieties: {
          concord: {
            color: "dark purple",
            origin: "USA",
          },
          muscat: {
            color: "green",
            origin: "Japan",
          },
        },
      },
    });

    console.log("グレープデータの挿入に成功しました！");
  } catch (error) {
    console.error("グレープデータの挿入に失敗しました:", error);
  }
}

insertGrapeData();
