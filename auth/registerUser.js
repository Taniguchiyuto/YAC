// auth/registerUser.js
import { auth } from "../firebase"; // firebase.jsのパスに応じて変更
import { createUserWithEmailAndPassword } from "firebase/auth";

async function registerUser(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    console.log("ユーザー登録成功:", userCredential.user);
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      console.error(
        "このメールアドレスはすでに使用されています。別のメールアドレスをお試しください。"
      );
    } else {
      console.error("ユーザー登録失敗:", error.message);
    }
  }
}

export default registerUser;
