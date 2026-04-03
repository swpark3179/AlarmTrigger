import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Loader2, Check, BellRing, AlertCircle } from "lucide-react";
import MarkdownViewer from "./components/MarkdownViewer";
import "./index.css";

interface AlarmData {
  title: string;
  content: string;
}

function App() {
  const [data, setData] = useState<AlarmData | null>(null);
  const [isClosing, setIsClosing] = useState(false);

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

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isClosing) {
        setIsClosing(true);
        await invoke("close_app");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isClosing]);

  const handleClose = async () => {
    if (isClosing) return;
    setIsClosing(true);
    await invoke("close_app");
  };

  const isError = data?.title === "오류";

  return (
    <main className="app-container">
      <h2 className="title" aria-live="polite">
        {data ? (
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            {isError ? (
              <AlertCircle size={24} aria-hidden="true" color="var(--nord11)" />
            ) : (
              <BellRing size={24} aria-hidden="true" color="var(--nord10)" />
            )}
            {data.title}
          </span>
        ) : (
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "var(--text-muted)" }}>
            <Loader2 className="animate-spin" size={24} aria-hidden="true" />
            로딩 중...
          </span>
        )}
      </h2>
      
      <div
        className="content-box"
        tabIndex={0}
        role="region"
        aria-label="알람 내용"
      >
        {data ? (
          <MarkdownViewer content={data.content || "표시할 내용이 없습니다."} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--nord3)", gap: "12px" }} aria-live="polite">
            <Loader2 className="animate-spin" size={32} aria-hidden="true" style={{ color: "var(--nord9)" }} />
            <span>데이터를 불러오는 중...</span>
          </div>
        )}
      </div>

      <footer className="footer">
        <button
          className="confirm-btn"
          onClick={handleClose}
          autoFocus
          disabled={isClosing}
          aria-label={isClosing ? "닫는 중..." : "확인 (Esc 눌러서 닫기)"}
          aria-busy={isClosing}
          style={{ display: "flex", alignItems: "center", gap: "8px", opacity: isClosing ? 0.8 : 1, cursor: isClosing ? "wait" : "pointer" }}
        >
          {isClosing ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <Check size={18} aria-hidden="true" />}
          {isClosing ? "닫는 중..." : "확인"}
          {!isClosing && (
            <kbd style={{
              fontSize: "0.75rem",
              background: "var(--nord3)",
              color: "var(--nord6)",
              padding: "2px 6px",
              borderRadius: "4px",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
              boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.2)"
            }}>Esc</kbd>
          )}
        </button>
      </footer>
    </main>
  );
}

export default App;
