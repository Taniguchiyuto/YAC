// auth/resetPassword.js
import { auth } from "../firebase"; // firebase.jsのパスに応じて変更
import { sendPasswordResetEmail } from "firebase/auth";

async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log("パスワードリセットメールが送信されました:", email);
  } catch (error) {
    console.error("パスワードリセット失敗:", error.message);
    throw error;
  }
}

export default resetPassword;
