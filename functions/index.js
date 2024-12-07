const functions = require("firebase-functions");

// スケジュールされた関数: 毎日午前0時（UTC）に実行
exports.dailyTask = functions.pubsub
    .schedule("0 0 * * *") // cron形式
    .timeZone("Asia/Tokyo") // 日本時間で実行
    .onRun((context) => {
      console.log("1日1回のタスクが実行されました！");

      // 実行するロジック
      // 例: データベースの更新、APIの呼び出しなど
      return null;
    });
