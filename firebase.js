// firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Firebase の設定情報
const firebaseConfig = {
  apiKey: "AIzaSyC47A8SyQ13KUakMVXZfS5UWNzeqJUZLmY",
  authDomain: "gpt-shift.firebaseapp.com",
  databaseURL: "https://gpt-shift-default-rtdb.firebaseio.com",
  projectId: "gpt-shift",
  storageBucket: "gpt-shift.firebasestorage.app",
  messagingSenderId: "261117513911",
  appId: "1:261117513911:web:7ca6e0d897dc40fedb7d32",
  measurementId: "G-2HSV0JS958",
};

// 既存の Firebase App インスタンスがあるか確認
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Analytics（必要に応じて）
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

// Realtime Database のインスタンスをエクスポート
export const database = getDatabase(app);
export { analytics };
export const auth = getAuth(app);
