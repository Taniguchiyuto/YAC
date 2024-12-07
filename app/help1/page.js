"use client"; // クライアントサイドで動作させる

import React, { useState, useEffect } from "react";

export default function VideoPage() {
  // 状態管理用フックを宣言
  const [url, setUrl] = useState("");
  const [videoData, setVideoData] = useState(null);
  const [error, setError] = useState(null);

  // YouTubeのURLから動画IDを抽出する関数
  const extractVideoId = (url) => {
    const regex =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // APIを使用して動画情報を取得する関数
  const fetchVideoData = async (videoId) => {
    const API_KEY = "AIzaSyAWJHOOY4-qN97iXjvGm4de4HF5Le4oIcI"; // 自分のAPIキーを入れてください
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${API_KEY}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("YouTube APIリクエストが失敗しました");
      }

      const data = await response.json();
      if (data.items.length > 0) {
        const videoInfo = data.items[0];
        const fetchedData = {
          title: videoInfo.snippet.title,
          views: videoInfo.statistics.viewCount,
          likes: videoInfo.statistics.likeCount,
        };
        // 状態に保存し、localStorageにキャッシュ
        setVideoData(fetchedData);
        localStorage.setItem(
          `videoData-${videoId}`,
          JSON.stringify(fetchedData)
        );
        localStorage.setItem(
          `videoDataTimestamp-${videoId}`,
          Date.now().toString()
        );
        setError(null); // エラーをクリア
      } else {
        throw new Error("動画が見つかりませんでした。");
      }
    } catch (error) {
      setError(error.message);
      setVideoData(null); // エラーが発生した場合はデータをクリア
    }
  };

  // フォーム送信時の処理
  const handleSubmit = (e) => {
    e.preventDefault();
    const videoId = extractVideoId(url);
    if (videoId) {
      // まずキャッシュを確認
      const cachedData = localStorage.getItem(`videoData-${videoId}`);
      const cachedTimestamp = localStorage.getItem(
        `videoDataTimestamp-${videoId}`
      );
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000; // 24時間

      if (
        cachedData &&
        cachedTimestamp &&
        now - parseInt(cachedTimestamp) < oneDay
      ) {
        // キャッシュが存在し、24時間以内ならキャッシュを使う
        setVideoData(JSON.parse(cachedData));
        setError(null);
      } else {
        // キャッシュがないか、24時間以上経過しているなら新しいデータを取得
        fetchVideoData(videoId);
      }
    } else {
      setError("有効なYouTube URLを入力してください。");
      setVideoData(null);
    }
  };

  return (
    <div>
      <h1>YouTube動画の情報を取得</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="YouTubeのURLを入力してください"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button type="submit">動画情報を取得</button>
      </form>

      {error && <div style={{ color: "red" }}>エラー: {error}</div>}

      {videoData && (
        <div>
          <h2>動画情報</h2>
          <p>タイトル: {videoData.title}</p>
          <p>再生回数: {videoData.views}</p>
          <p>いいね数: {videoData.likes}</p>
        </div>
      )}
    </div>
  );
}
