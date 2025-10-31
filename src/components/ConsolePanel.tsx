import { Terminal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { themeType, logType } from "../types/misc";
import TypingText from "./TypingText";

// Console Panel Component
const ConsolePanel = ({
  logs,
  onClear,
}: {
  logs: logType[];
  onClear: () => void;
}) => {
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  const [theme] = useState<themeType>({
    primary: "text-green-300",
    secondary: "text-green-300",
  });

  return (
    <div className="h-full flex flex-col bg-black/90 border-2 border-green-900/50 rounded-sm">
      <div className="bg-gradient-to-r from-green-950/80 to-black/80 px-3 py-2 border-b border-green-900/30 flex items-center gap-2">
        <Terminal className="w-4 h-4 text-green-500" />
        <span className="text-green-400 font-mono text-xs font-bold tracking-wider">
          CONSOLE OUTPUT
        </span>
        <div className="ml-auto flex items-center gap-2 text-green-700 font-mono">
          <span className="text-[10px] text-green-700 font-mono">
            {logs.length} ENTRIES
          </span>
          <button
            onClick={onClear}
            className="text-[10px] text-red-600 hover:text-red-500 font-mono"
          >
            CLEAR
          </button>
        </div>
      </div>
      <div
        ref={consoleRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-3 font-mono text-xs text-green-400 space-y-1  [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {logs.length === 0 ? (
          <div className="text-green-700">// Awaiting execution...</div>
        ) : (
          logs.map((log, idx) => (
            <div key={idx}>
              <TypingText key={idx} log={log} delay={idx * 30} theme={theme} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConsolePanel;
