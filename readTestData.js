// readTestData.js
import { ref, get } from "firebase/database";
import { database } from "./firebase";

async function readTestData() {
  try {
    const snapshot = await get(ref(database, "test_connection"));
    if (snapshot.exists()) {
      console.log("データの読み取りに成功しました:", snapshot.val());
    } else {
      console.log("データが存在しません");
    }
  } catch (error) {
    console.error("データの読み取りに失敗しました:", error);
  }
}

export default readTestData;
