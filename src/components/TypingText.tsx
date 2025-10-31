import { useEffect, useState } from "react";
import type { logType, themeType } from "../types/misc";

const TypingText = ({
  log,
  delay,
  theme,
}: {
  log: logType;
  delay: number;
  theme: themeType;
}) => {
  const [displayText, setDisplayText] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(showTimer);
  }, [delay]);

  useEffect(() => {
    if (!show) return;
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= log.message.length) {
        setDisplayText(log.message.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 8);
    return () => clearInterval(interval);
  }, [log.message, show]);

  if (!show) return null;

  const colors: Record<string, string> = {
    info: theme.primary,
    system: theme.primary,
    success: "text-green-300",
    warning: "text-amber-400",
    error: "text-red-400",
    command: "text-blue-400",
  };

  return (
    <div
      className={`${colors[(log.type && log.type.toLowerCase()) ?? "info"]} mb-1 break-words`}
    >
      <span className={theme.secondary}>[{log.timestamp}] </span>
      <span className="text-green-600">{log.nodeId}: </span>
      <span
        className={log.type === "error" ? "text-red-500" : "text-green-400"}
      >
        {displayText}
      </span>
      {displayText.length < log.message.length && (
        <span className="animate-pulse">_</span>
      )}
    </div>
  );
};

export default TypingText;
