import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import MarkdownViewer from "./components/MarkdownViewer";
import "./index.css";

interface AlarmData {
  title: string;
  content: string;
}

function App() {
  const [data, setData] = useState<AlarmData | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const result: AlarmData = await invoke("get_alarm_data");
        setData(result);
      } catch (error) {
        console.error("Failed to fetch alarm data:", error);
        setData({ title: "오류", content: "알람 데이터를 불러오지 못했습니다." });
      }
    }
    fetchData();
  }, []);

  const handleClose = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.close();
  };

  return (
    <div className="app-container">
      <h2 className="title">{data ? data.title : "로딩 중..."}</h2>
      
      <div className="content-box">
        {data ? (
          <MarkdownViewer content={data.content || "표시할 내용이 없습니다."} />
        ) : (
          <div style={{ textAlign: "center", color: "#64748b" }}>데이터를 불러오는 중...</div>
        )}
      </div>

      <div className="footer">
        <button className="confirm-btn" onClick={handleClose}>
          확인
        </button>
      </div>
    </div>
  );
}

export default App;
