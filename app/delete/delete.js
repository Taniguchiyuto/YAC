export const getAndDeleteLocalStorageData = () => {
  // localStorageからデータを取得
  const tempData = localStorage.getItem("tempData");

  if (tempData) {
    // JSONとしてパース
    const parsedData = JSON.parse(tempData);

    // localStorageから削除
    localStorage.removeItem("tempData");

    // 抽出したデータを返す
    return parsedData;
  }

  // データがない場合はnullを返す
  return null;
};
