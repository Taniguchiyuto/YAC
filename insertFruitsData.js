// insertFruitsData.js
import { ref, set } from "firebase/database";
import { database } from "./firebase"; // firebase.jsのパスに応じて変更

async function insertFruitsData() {
  try {
    await set(ref(database, "fruits"), {
      apple: {
        color: "red",
        origin: "USA",
        varieties: {
          fuji: {
            color: "red",
            origin: "Japan",
          },
          grannySmith: {
            color: "green",
            origin: "Australia",
          },
        },
      },
      banana: {
        color: "yellow",
        origin: "Ecuador",
      },
      orange: {
        color: "orange",
        origin: "Spain",
        varieties: {
          navel: {
            color: "orange",
            origin: "USA",
          },
          valencia: {
            color: "orange",
            origin: "Spain",
          },
        },
      },
    });

    console.log("フルーツデータの挿入に成功しました！");
  } catch (error) {
    console.error("データの挿入に失敗しました:", error);
  }
}

export default insertFruitsData;
