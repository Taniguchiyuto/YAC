// app/page.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import registerUser from "../auth/registerUser";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    try {
      await registerUser(email, password);
      router.push("/dashboard");
    } catch (error) {
      console.error("登録エラー:", error.message);
      alert("登録に失敗しました。");
    }
  };

  return (
    <div>
      <h1>ユーザー登録</h1>
      <input
        type="email"
        placeholder="メールアドレス"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="パスワード"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleRegister}>登録</button>
      <p>
        既にアカウントをお持ちですか？{" "}
        <a onClick={() => router.push("/login")}>ログイン</a>
      </p>
    </div>
  );
}
