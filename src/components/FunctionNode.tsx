import {
  Activity,
  Code,
  Database,
  GitBranch,
  Maximize2,
  Minimize2,
  Repeat,
  Trash2,
  Webhook,
  Zap,
} from "lucide-react";
import CodeEditor from "./CodeEditor";
import { useRef, useState } from "react";
import { Handle, Position } from "reactflow";

// Node Component with drag prevention, using 'nodrag' class for simplicity
const FunctionNode = ({
  data,
  id,
  selected,
}: {
  data: any;
  id: string;
  selected: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
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

  // Determine node color based on the node type
  const getNodeColor = () => {
    switch (data.nodeType) {
      case "CONDITION":
        return "border-yellow-500/50";
      case "LOOP":
        return "border-blue-500/50";
      case "HTTP":
        return "border-purple-500/50";
      case "STORAGE":
        return "border-cyan-500/50";
      case "DATABASE":
        return "border-indigo-500/50";
      case "WEBHOOK":
        return "border-orange-500/50";
      default:
        return "border-green-900/50";
    }
  };

  const getNodeIcon = () => {
    switch (data.nodeType) {
      case "CONDITION":
        return <GitBranch className="w-4 h-4 text-yellow-500" />;
      case "LOOP":
        return <Repeat className="w-4 h-4 text-blue-500" />;
      case "HTTP":
        return <Zap className="w-4 h-4 text-purple-500" />;
      case "STORAGE":
        return <Database className="w-4 h-4 text-cyan-500" />;
      case "DATABASE":
        return <Activity className="w-4 h-4 text-indigo-500" />;
      case "WEBHOOK":
        return <Webhook className="w-4 h-4 text-orange-500" />;
      default:
        return <Code className="w-4 h-4 text-green-500" />;
    }
  };

  // Show multiple output handles for condition nodes
  const showMultipleOutputs = data.nodeType === "CONDITION";

  return (
    <div
      ref={nodeRef}
      className={`bg-black/90 border-2 node  ${data.status === "RUNNING" ? "executing" : selected ? "border-green-400" : getNodeColor()} rounded-sm min-w-[320px] shadow-2xl shadow-green-900/20 transition-all`}
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
          {getNodeIcon()}
          <input
            type="text"
            value={data.label}
            onChange={(e) => data.onLabelChange(id, e.target.value)}
            className="bg-transparent text-green-400 font-mono text-xs font-bold tracking-wider border-none outline-none focus:text-green-300"
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
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
            className="text-red-600 hover:text-red-400 transition-colors p-1"
            title="Delete Node"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Node Body */}
      <div className="p-3">
        <div className="text-[10px] text-green-700 font-mono mb-2 flex justify-between">
          <span>TYPE: {data.nodeType || "FUNCTION"}</span>
          <span className={`${isEditing ? "text-yellow-500" : ""}`}>
            {isEditing ? "● EDITING" : "○ STANDBY"}
          </span>
        </div>

        {isExpanded && (
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
          {/*{data.lastResult && (*/}
          <div
            className={`truncate uppercase ${data.status === "COMPLETE" ? "text-green-500" : data.status === "ERROR" ? "text-red-500" : "text-blue-500"}`}
          >
            OUTPUT:{" "}
            {data.status === "COMPLETE"
              ? "Success"
              : data.status === "ERROR"
                ? "Failed"
                : "Standby"}
          </div>
          {/*)}*/}
          {data.nodeType === "LOOP" && data.loopCount && (
            <div className="text-blue-400">ITERATIONS: {data.loopCount}</div>
          )}
        </div>
      </div>

      {/* Output Handle - (Right side) / Multiple for condition nodes */}
      {showMultipleOutputs ? (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            style={{ top: "60%" }}
            className="w-4 h-4 mr-[-1px] p-1 !bg-green-500 !border-2 !border-black hover:!bg-green-400 transition-colors"
          />
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            style={{ top: "80%" }}
            className="w-4 h-4 mr-[-1px] p-1 !bg-red-600 !border-2 !border-black hover:!bg-red-500 transition-colors"
          />
          <div className="absolute right-2 top-[56.4%] text-[8px] text-green-500 font-mono pointer-events-none">
            TRUE
          </div>
          <div className="absolute right-2 top-[76.4%] text-[8px] text-red-500 font-mono pointer-events-none">
            FALSE
          </div>
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          className="w-4 h-4 mr-[-1px] p-1 !bg-green-500 !border-2 !border-black"
        />
      )}
    </div>
  );
};

export default FunctionNode;
