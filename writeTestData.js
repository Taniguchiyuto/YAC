// writeTestData.js
import { ref, set } from "firebase/database";
import { database } from "./firebase"; // firebase.jsのパスに応じて変更

async function writeTestData() {
  try {
    await set(ref(database, "test_connection"), {
      message: "Hello, Firebase!",
    });
    console.log("データの書き込みに成功しました！");
  } catch (error) {
    console.error("データの書き込みに失敗しました:", error);
  }
}

export default writeTestData;
