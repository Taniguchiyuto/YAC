// auth/loginUser.js
import { auth } from "../firebase"; // firebase.js のパスに応じて変更
import { signInWithEmailAndPassword } from "firebase/auth";

async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    console.log("ログイン成功:", userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error("ログイン失敗:", error.message);
    throw error; // エラーを呼び出し元でキャッチできるように投げます
  }
}

export default loginUser;
