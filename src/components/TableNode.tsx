import { Code2, Maximize2, Minimize2, Table, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Handle, Position } from "reactflow";
import CodeEditor from "./CodeEditor";

const TableNode = ({
  data,
  id,
  selected,
}: {
  data: any;
  id: string;
  selected: boolean;
}) => {
  const [activeView, setActiveView] = useState<"editor" | "table" | "summary">(
    "summary",
  );
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState(false);

  const nodeRef = useRef<HTMLDivElement>(null);

  const handleEditorMount = (editor: any) => {
    setIsEditing(false);

    // Prevent node drag when editor is focused
    editor.onDidFocusEditorText(() => {
      setIsEditing(true);
      if (nodeRef.current) {
        nodeRef.current.classList.add("nodrag");
      }
    });

    editor.onDidBlurEditorText(() => {
      setIsEditing(false);
      if (nodeRef.current) {
        nodeRef.current.classList.remove("nodrag");
      }
    });
  };
  return (
    <div
      ref={nodeRef}
      className={`bg-black/90 border-2 node  ${data.status === "RUNNING" ? "executing" : selected ? "border-purple-400/80" : "border-green-900/50"} rounded-sm min-w-[320px] shadow-2xl shadow-green-900/20 transition-all`}
    >
      {/* Input Handle (Left side) */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 ml-[-1px] p-1 !bg-green-500 !border-2 !border-black transition-colors"
      />
      {/* Node Header */}
      <div className="bg-gradient-to-r from-green-950/80 to-black/80 px-3 py-2 border-b border-green-900/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-purple-500" />
          <input
            type="text"
            value={data.label}
            onChange={(e) => data.onLabelChange(id, e.target.value)}
            className="bg-transparent text-green-400 font-mono text-xs font-bold tracking-wider border-none outline-none focus:text-green-300"
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveView("editor")}
            className="text-green-600 hover:text-green-400 transition-colors p-1"
            title={activeView === "editor" ? "Close Editor" : "Expand Editor"}
          >
            <Code2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              setActiveView(isExpanded ? "summary" : "table");
              setIsExpanded(!isExpanded);
            }}
            className="text-green-600 hover:text-green-400 transition-colors p-1"
            title={isExpanded ? "Minimize" : "Expand"}
          >
            {isExpanded ? (
              <Minimize2 className="w-3 h-3" />
            ) : (
              <Maximize2 className="w-3 h-3" />
            )}
          </button>
          <button
            onClick={() => data.onDelete(id)}
            className="text-red-800 hover:text-red-600 transition-colors p-1"
            title="Delete Node"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Node Body */}
      <div className="p-2">
        <div className="text-[10px] text-green-700 font-mono mb-2 flex justify-between">
          <span>TYPE: {data.nodeType || "FUNCTION"}</span>
          <span className={`${isEditing ? "text-yellow-500" : ""}`}>
            {isEditing ? "● VIEWING" : "○ STANDBY"}
          </span>
        </div>

        {activeView === "editor" && (
          <div
            className="mb-3 relative"
            style={{ height: "400px", width: "500px" }}
          >
            <CodeEditor
              value={data.code}
              onChange={(newCode) => data.onCodeChange(id, newCode)}
              nodeId={id}
              onEditorMount={handleEditorMount}
            />
          </div>
        )}
        {activeView !== "editor" && data.lastResult && (
          <h3
            className={`text-sm text-green-600 capitalize underline font-bold tracking-wide`}
          >
            {data?.lastResult?.tableName}
          </h3>
        )}

        {activeView === "summary" && (
          <div className="text-xs ">
            <p className="text-green-600">Data Summary:</p>
            <div className="ml-4">
              <p className="text-green-600 ">
                Columns: {data?.lastResult?.tableColumns?.length ?? 0}
              </p>
              <p className="text-green-600">
                Rows: {data?.lastResult?.data.length ?? 0}
              </p>
            </div>
          </div>
        )}
        {activeView === "table" && (
          <div
            className={`overflow-x-auto ${selected && "nodrag cursor-text"}`}
          >
            {data?.lastResult?.data ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className={`border-b bg-red`}>
                    {data?.lastResult?.tableColumns?.map(
                      (row: string, key: number) => {
                        return (
                          <th
                            key={key}
                            className={`text-left uppercase text-green-700 p-2`}
                          >
                            {row}
                          </th>
                        );
                      },
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data?.lastResult?.data?.map(
                    (cell: Record<string, string>, index: number) => (
                      <tr
                        key={index}
                        className={`border-b [&>td]:p-2 [&>td:last]:text-right [&>td:last]:font-bold border-green-500/10 hover: transition-colors`}
                      >
                        {Object.values(cell).map((val: string) => {
                          return <td className="text-green-700">{val}</td>;
                        })}
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            ) : (
              <div className="flex justify-center items-center">
                <p className="text-green-600 font-semibold">
                  No data available!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="text-[10px] text-green-600 font-mono bg-black/50 p-2 border border-green-900/20 space-y-1">
        <div className="truncate">LAST: {data.lastExecution || "NEVER"}</div>
        <div className="truncate flex justify-between">
          <span>
            STATUS:{" "}
            <span
              className={`${
                data.status === "COMPLETE"
                  ? "text-green-400"
                  : data.status === "ERROR"
                    ? "text-red-500"
                    : data.status === "RUNNING"
                      ? "text-yellow-500"
                      : "text-green-700"
              }`}
            >
              {data.status || "STANDBY"}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default TableNode;
