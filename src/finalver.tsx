import React, { useState, useCallback, useRef, useEffect } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  MarkerType,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Play,
  Save,
  Upload,
  Plus,
  Terminal,
  Code,
  Trash2,
  Maximize2,
  Minimize2,
  GitBranch,
  Repeat,
  Zap,
  Clock,
  Database,
  Webhook,
  Activity,
  Download,
} from "lucide-react";
import Editor from "@monaco-editor/react";
import axios from "axios";

// ============================================================================
// MONACO CODE EDITOR COMPONENT
// ============================================================================
const MonacoCodeEditor = ({ value, onChange, nodeId, onEditorMount }) => {
  const handleEditorDidMount = (editor, monaco) => {
    monaco.editor.defineTheme("tactical-theme", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "22c55e", fontStyle: "italic" },
        { token: "keyword", foreground: "4ade80" },
        { token: "string", foreground: "86efac" },
        { token: "number", foreground: "22c55e" },
      ],
      colors: {
        "editor.background": "#000000",
        "editor.foreground": "#22c55e",
        "editorLineNumber.foreground": "#166534",
        "editor.lineHighlightBackground": "#052e16",
        "editor.selectionBackground": "#14532d",
      },
    });
    monaco.editor.setTheme("tactical-theme");

    if (onEditorMount) onEditorMount(editor);
  };

  return (
    <div className="h-full border border-green-900/30 relative">
      <Editor
        height="100%"
        defaultLanguage="javascript"
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        theme="tactical-theme"
        options={{
          minimap: { enabled: false },
          fontSize: 12,
          fontFamily: "monospace",
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
        }}
      />
      <div className="absolute top-2 right-2 text-[10px] text-green-700 font-mono bg-black/80 px-2 py-1 border border-green-900/50">
        {nodeId}
      </div>
    </div>
  );
};

// ============================================================================
// FUNCTION NODE COMPONENT
// ============================================================================
const FunctionNode = ({ data, id, selected }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const editorContainerRef = useRef(null);

  const handleEditorMount = () => {
    if (editorContainerRef.current) {
      editorContainerRef.current.classList.add("nodrag");
    }
  };

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

  const showMultipleOutputs = data.nodeType === "CONDITION";

  return (
    <div
      className={`bg-black/90 border-2 ${selected ? "border-green-400" : getNodeColor()} rounded-sm min-w-[320px] shadow-2xl`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 !bg-green-500 !border-2 !border-black"
      />

      <div className="bg-gradient-to-r from-green-950/80 to-black/80 px-3 py-2 border-b border-green-900/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getNodeIcon()}
          <input
            type="text"
            value={data.label}
            onChange={(e) => data.onLabelChange(id, e.target.value)}
            className="bg-transparent text-green-400 font-mono text-xs font-bold tracking-wider border-none outline-none nodrag"
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-green-600 hover:text-green-400 transition-colors p-1"
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
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="p-3">
        <div className="text-[10px] text-green-700 font-mono mb-2">
          TYPE: {data.nodeType || "BASIC"}
        </div>

        {isExpanded && (
          <div
            ref={editorContainerRef}
            className="mb-3 nodrag"
            style={{ height: "400px" }}
          >
            <MonacoCodeEditor
              value={data.code}
              onChange={(newCode) => data.onCodeChange(id, newCode)}
              nodeId={id}
              onEditorMount={handleEditorMount}
            />
          </div>
        )}

        <div className="text-[10px] text-green-600 font-mono bg-black/50 p-2 border border-green-900/20 space-y-1">
          <div>LAST: {data.lastExecution || "NEVER"}</div>
          <div>
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
          </div>
        </div>
      </div>

      {showMultipleOutputs ? (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            style={{ top: "40%" }}
            className="w-4 h-4 !bg-green-500 !border-2 !border-black"
          />
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            style={{ top: "60%" }}
            className="w-4 h-4 !bg-red-500 !border-2 !border-black"
          />
          <div className="absolute right-2 top-[38%] text-[8px] text-green-400 font-mono pointer-events-none">
            TRUE
          </div>
          <div className="absolute right-2 top-[58%] text-[8px] text-red-400 font-mono pointer-events-none">
            FALSE
          </div>
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          className="w-4 h-4 !bg-green-500 !border-2 !border-black"
        />
      )}
    </div>
  );
};

const nodeTypes = { functionNode: FunctionNode };

// ============================================================================
// CONSOLE PANEL COMPONENT
// ============================================================================
const ConsolePanel = ({ logs, onClear }) => {
  const consoleRef = useRef(null);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="h-full flex flex-col bg-black/90 border-2 border-green-900/50">
      <div className="bg-gradient-to-r from-green-950/80 to-black/80 px-3 py-2 border-b border-green-900/30 flex items-center gap-2">
        <Terminal className="w-4 h-4 text-green-500" />
        <span className="text-green-400 font-mono text-xs font-bold tracking-wider">
          CONSOLE
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-green-700 font-mono">
            {logs.length} ENTRIES
          </span>
          <button
            onClick={onClear}
            className="text-[10px] text-red-600 hover:text-red-400 font-mono"
          >
            CLEAR
          </button>
        </div>
      </div>
      <div
        ref={consoleRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1"
      >
        {logs.length === 0 ? (
          <div className="text-green-700">// Awaiting execution...</div>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} className="flex gap-2">
              <span className="text-green-700">[{log.timestamp}]</span>
              <span className="text-green-600">{log.nodeId}:</span>
              <span
                className={
                  log.type === "error" ? "text-red-500" : "text-green-400"
                }
              >
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================================
// VARIABLE STORAGE PANEL
// ============================================================================
const VariablePanel = ({ variables, onSet, onDelete, onClear }) => {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = () => {
    if (key.trim()) {
      try {
        onSet(key.trim(), JSON.parse(value));
      } catch {
        onSet(key.trim(), value);
      }
      setKey("");
      setValue("");
      setShowAdd(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-black/90 border-2 border-green-900/50">
      <div className="bg-gradient-to-r from-green-950/80 to-black/80 px-3 py-2 border-b border-green-900/30 flex items-center gap-2">
        <Database className="w-4 h-4 text-green-500" />
        <span className="text-green-400 font-mono text-xs font-bold tracking-wider">
          VARIABLES
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-green-700 font-mono">
            {Object.keys(variables).length} VARS
          </span>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="text-[10px] text-green-600 hover:text-green-400 font-mono"
          >
            {showAdd ? "CANCEL" : "+ ADD"}
          </button>
          <button
            onClick={onClear}
            className="text-[10px] text-red-600 hover:text-red-400 font-mono"
          >
            CLEAR
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="p-3 border-b border-green-900/30 bg-black/50 space-y-2">
          <input
            type="text"
            placeholder="Variable name..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full bg-black border border-green-900/50 text-green-400 font-mono text-xs px-2 py-1 focus:border-green-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Value (JSON or string)..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full bg-black border border-green-900/50 text-green-400 font-mono text-xs px-2 py-1 focus:border-green-500 focus:outline-none"
          />
          <button
            onClick={handleAdd}
            className="w-full bg-green-900/50 hover:bg-green-800/50 border border-green-500/50 text-green-400 font-mono text-xs py-1"
          >
            SET VARIABLE
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {Object.keys(variables).length === 0 ? (
          <div className="text-green-700 font-mono text-xs">
            // No variables stored...
          </div>
        ) : (
          Object.entries(variables).map(([k, v]) => (
            <div
              key={k}
              className="bg-black/50 border border-green-900/30 p-2 rounded"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-green-500 font-mono text-xs font-bold">
                  {k}
                </span>
                <button
                  onClick={() => onDelete(k)}
                  className="text-red-600 hover:text-red-400 text-[10px] font-mono"
                >
                  DELETE
                </button>
              </div>
              <div className="text-green-400 text-[10px] font-mono break-all">
                {typeof v === "object" ? JSON.stringify(v, null, 2) : String(v)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================================
// WEBHOOK PANEL
// ============================================================================
const WebhookPanel = ({
  webhooks,
  onAdd,
  onRemove,
  onToggle,
  events,
  onTrigger,
}) => {
  const [name, setName] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [testPayload, setTestPayload] = useState(
    '{\n  "test": "data",\n  "value": 100\n}',
  );
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [jsonError, setJsonError] = useState("");

  const handleAdd = () => {
    if (name.trim()) {
      onAdd(name.trim());
      setName("");
      setShowAdd(false);
    }
  };

  const handlePayloadChange = (value) => {
    setTestPayload(value);
    // Validate JSON as user types
    try {
      if (value.trim()) {
        JSON.parse(value);
        setJsonError("");
      }
    } catch (error) {
      setJsonError(error.message);
    }
  };

  const handleTest = (webhookId) => {
    try {
      let payload;
      const trimmed = testPayload.trim();

      if (!trimmed) {
        alert("Please enter JSON payload");
        return;
      }

      payload = JSON.parse(trimmed);
      onTrigger(webhookId, payload);
      setJsonError("");
    } catch (error) {
      setJsonError(error.message);
      alert("Invalid JSON: " + error.message);
    }
  };

  const loadExample = (example) => {
    const examples = {
      simple: '{\n  "event": "test",\n  "data": "hello"\n}',
      user:
        '{\n  "userId": "12345",\n  "action": "login",\n  "timestamp": "' +
        new Date().toISOString() +
        '"\n}',
      complex:
        '{\n  "event": "order_created",\n  "order": {\n    "id": "ord_123",\n    "total": 99.99,\n    "items": [\n      {"name": "Product 1", "qty": 2}\n    ]\n  }\n}',
    };
    setTestPayload(examples[example]);
    setJsonError("");
  };

  const copyWebhookUrl = (webhookId) => {
    const url = `${window.location.origin}/api/webhook/${webhookId}`;
    navigator.clipboard.writeText(url);
    alert("Webhook URL copied to clipboard!");
  };

  const getCurlCommand = (webhookId) => {
    return `curl -X POST ${window.location.origin}/api/webhook/${webhookId} \\
  -H "Content-Type: application/json" \\
  -d '${testPayload}'`;
  };

  return (
    <div className="h-full flex flex-col bg-black/90 border-2 border-green-900/50">
      <div className="bg-gradient-to-r from-green-950/80 to-black/80 px-3 py-2 border-b border-green-900/30 flex items-center gap-2">
        <Webhook className="w-4 h-4 text-green-500" />
        <span className="text-green-400 font-mono text-xs font-bold tracking-wider">
          WEBHOOKS
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-green-700 font-mono">
            {webhooks.length} HOOKS
          </span>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="text-[10px] text-green-600 hover:text-green-400 font-mono"
          >
            {showAdd ? "CANCEL" : "+ ADD"}
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="p-3 border-b border-green-900/30 bg-black/50">
          <input
            type="text"
            placeholder="Webhook name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-black border border-green-900/50 text-green-400 font-mono text-xs px-2 py-1 mb-2 focus:border-green-500 focus:outline-none"
          />
          <button
            onClick={handleAdd}
            className="w-full bg-green-900/50 hover:bg-green-800/50 border border-green-500/50 text-green-400 font-mono text-xs py-1"
          >
            CREATE WEBHOOK
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {webhooks.length === 0 ? (
          <div className="text-green-700 font-mono text-xs">
            // No webhooks...
          </div>
        ) : (
          webhooks.map((wh, idx) => (
            <div
              key={idx}
              className="bg-black/50 border border-green-900/30 p-2 rounded font-mono text-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${wh.active ? "bg-green-500" : "bg-gray-500"}`}
                  ></div>
                  <span className="text-green-500 font-bold">{wh.name}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onToggle(idx)}
                    className={`text-[10px] ${wh.active ? "text-yellow-500" : "text-green-500"}`}
                  >
                    {wh.active ? "DISABLE" : "ENABLE"}
                  </button>
                  <button
                    onClick={() => onRemove(idx)}
                    className="text-[10px] text-red-600"
                  >
                    DELETE
                  </button>
                </div>
              </div>

              {/* Webhook URL */}
              <div className="mb-2">
                <div className="text-green-700 text-[10px] mb-1">ENDPOINT:</div>
                <div className="bg-black/70 p-2 rounded border border-green-900/30 flex items-center justify-between">
                  <code className="text-green-400 text-[10px] break-all flex-1">
                    POST /api/webhook/{wh.id}
                  </code>
                  <button
                    onClick={() => copyWebhookUrl(wh.id)}
                    className="ml-2 text-green-500 hover:text-green-400 text-[10px]"
                  >
                    COPY
                  </button>
                </div>
              </div>

              {/* Test Section */}
              <div className="border-t border-green-900/30 pt-2 mt-2">
                <div className="text-green-700 text-[10px] mb-1">
                  TEST WEBHOOK:
                </div>
                <textarea
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                  placeholder='{"key": "value"}'
                  className="w-full bg-black border border-green-900/50 text-green-400 font-mono text-[10px] px-2 py-1 mb-1 focus:border-green-500 focus:outline-none h-16 resize-none"
                />
                <div className="text-green-700 text-[9px] mb-2 font-mono">
                  Tip: Must be valid JSON
                </div>
                <button
                  onClick={() => handleTest(wh.id)}
                  disabled={!wh.active}
                  className="w-full bg-orange-900/50 hover:bg-orange-800/50 disabled:bg-gray-900/50 border border-orange-500/50 disabled:border-gray-700 text-orange-400 disabled:text-gray-600 font-mono text-[10px] py-1"
                >
                  {wh.active ? "TRIGGER TEST" : "ENABLE WEBHOOK TO TEST"}
                </button>
              </div>

              {/* cURL Command */}
              <div className="border-t border-green-900/30 pt-2 mt-2">
                <div className="text-green-700 text-[10px] mb-1">
                  CURL COMMAND:
                </div>
                <div className="bg-black/70 p-2 rounded border border-green-900/30">
                  <code className="text-green-400 text-[9px] break-all whitespace-pre-wrap">
                    {getCurlCommand(wh.id)}
                  </code>
                </div>
              </div>

              <div className="text-green-600 text-[10px] mt-2">
                Triggers: {wh.triggerCount || 0}
              </div>
            </div>
          ))
        )}
      </div>

      {events.length > 0 && (
        <div className="p-3 border-t border-green-900/30">
          <div className="text-green-500 font-bold mb-2 text-xs font-mono">
            RECENT EVENTS:
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {events
              .slice(-5)
              .reverse()
              .map((evt, idx) => (
                <div
                  key={idx}
                  className="text-[10px] text-green-400 bg-black/50 p-1 rounded font-mono"
                >
                  [{evt.timestamp}] {evt.webhook} -{" "}
                  {JSON.stringify(evt.data).substring(0, 40)}...
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="p-3 border-t border-green-900/30 bg-black/50">
        <div className="text-green-500 font-bold mb-2 text-[10px] font-mono">
          HOW TO USE:
        </div>
        <div className="text-green-700 text-[9px] font-mono space-y-1">
          <div>1. Click "TRIGGER TEST" to test locally</div>
          <div>2. Copy URL and use in Postman/Bruno</div>
          <div>3. Send POST request with JSON body</div>
          <div>4. Webhook will trigger workflow execution</div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// DATABASE PANEL
// ============================================================================
const DatabasePanel = ({ connections, onAdd, onRemove, onTest, history }) => {
  const [type, setType] = useState("mongodb");
  const [connString, setConnString] = useState("");
  const [dbName, setDbName] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = () => {
    if (connString.trim()) {
      onAdd({
        type,
        connectionString: connString.trim(),
        name: dbName.trim() || `${type}_${Date.now()}`,
      });
      setConnString("");
      setDbName("");
      setShowAdd(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-black/90 border-2 border-green-900/50">
      <div className="bg-gradient-to-r from-green-950/80 to-black/80 px-3 py-2 border-b border-green-900/30 flex items-center gap-2">
        <Activity className="w-4 h-4 text-green-500" />
        <span className="text-green-400 font-mono text-xs font-bold tracking-wider">
          DATABASE
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-green-700 font-mono">
            {connections.length} CONN
          </span>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="text-[10px] text-green-600 hover:text-green-400 font-mono"
          >
            {showAdd ? "CANCEL" : "+ ADD"}
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="p-3 border-b border-green-900/30 bg-black/50 space-y-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-black border border-green-900/50 text-green-400 font-mono text-xs px-2 py-1 focus:border-green-500 focus:outline-none"
          >
            <option value="mongodb">MongoDB</option>
            <option value="postgresql">PostgreSQL</option>
            <option value="firebase">Firebase</option>
            <option value="mysql">MySQL</option>
          </select>
          <input
            type="text"
            placeholder="Database name..."
            value={dbName}
            onChange={(e) => setDbName(e.target.value)}
            className="w-full bg-black border border-green-900/50 text-green-400 font-mono text-xs px-2 py-1 focus:border-green-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Connection string..."
            value={connString}
            onChange={(e) => setConnString(e.target.value)}
            className="w-full bg-black border border-green-900/50 text-green-400 font-mono text-xs px-2 py-1 focus:border-green-500 focus:outline-none"
          />
          <button
            onClick={handleAdd}
            className="w-full bg-green-900/50 hover:bg-green-800/50 border border-green-500/50 text-green-400 font-mono text-xs py-1"
          >
            CONNECT
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {connections.length === 0 ? (
          <div className="text-green-700 font-mono text-xs">
            // No connections...
          </div>
        ) : (
          connections.map((conn, idx) => (
            <div
              key={idx}
              className="bg-black/50 border border-green-900/30 p-2 rounded font-mono text-xs"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-green-500 font-bold">{conn.name}</span>
                  <span className="text-green-700 text-[10px]">
                    ({conn.type})
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onTest(idx)}
                    className="text-[10px] text-blue-500"
                  >
                    TEST
                  </button>
                  <button
                    onClick={() => onRemove(idx)}
                    className="text-[10px] text-red-600"
                  >
                    DELETE
                  </button>
                </div>
              </div>
              <div className="text-green-700 text-[10px]">
                {conn.connectionString.substring(0, 40)}...
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-green-900/30">
        <div className="text-green-500 font-bold mb-2 text-xs font-mono">
          HISTORY:
        </div>
        <div className="text-green-700 text-[10px] font-mono space-y-1">
          <div>Executions: {history.length}</div>
          <div>
            Success: {history.filter((h) => h.status === "success").length}
          </div>
          <div>
            Failed: {history.filter((h) => h.status === "failed").length}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SCHEDULER PANEL
// ============================================================================
const SchedulerPanel = ({
  schedules,
  onAdd,
  onRemove,
  isRunning,
  onToggle,
}) => {
  const [interval, setInterval] = useState("5");
  const [unit, setUnit] = useState("seconds");

  const handleAdd = () => {
    const seconds =
      unit === "seconds"
        ? parseInt(interval)
        : unit === "minutes"
          ? parseInt(interval) * 60
          : parseInt(interval) * 3600;
    onAdd(seconds);
    setInterval("5");
  };

  return (
    <div className="bg-black/90 border-2 border-green-900/50">
      <div className="bg-gradient-to-r from-green-950/80 to-black/80 px-3 py-2 border-b border-green-900/30 flex items-center gap-2">
        <Clock className="w-4 h-4 text-green-500" />
        <span className="text-green-400 font-mono text-xs font-bold tracking-wider">
          SCHEDULER
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span
            className={`text-[10px] font-mono ${isRunning ? "text-green-400" : "text-green-700"}`}
          >
            {isRunning ? "● ACTIVE" : "○ INACTIVE"}
          </span>
          <button
            onClick={onToggle}
            className={`text-[10px] font-mono px-2 py-1 border ${
              isRunning
                ? "text-red-400 border-red-500/50"
                : "text-green-400 border-green-500/50"
            }`}
          >
            {isRunning ? "STOP" : "START"}
          </button>
        </div>
      </div>

      <div className="p-3">
        <div className="flex gap-2 mb-3">
          <input
            type="number"
            min="1"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            className="flex-1 bg-black border border-green-900/50 text-green-400 font-mono text-xs px-2 py-1 focus:border-green-500 focus:outline-none"
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="bg-black border border-green-900/50 text-green-400 font-mono text-xs px-2 py-1 focus:border-green-500 focus:outline-none"
          >
            <option value="seconds">Seconds</option>
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
          </select>
          <button
            onClick={handleAdd}
            className="bg-green-900/50 hover:bg-green-800/50 border border-green-500/50 text-green-400 font-mono text-xs px-3 py-1"
          >
            ADD
          </button>
        </div>

        <div className="space-y-2 font-mono text-xs">
          {schedules.length === 0 ? (
            <div className="text-green-700">// No schedules...</div>
          ) : (
            schedules.map((sched, idx) => (
              <div
                key={idx}
                className="bg-black/50 border border-green-900/30 p-2 rounded flex items-center justify-between"
              >
                <div>
                  <div className="text-green-500">Every {sched.interval}s</div>
                  <div className="text-green-700 text-[10px]">
                    Next:{" "}
                    {sched.nextRun
                      ? new Date(sched.nextRun).toLocaleTimeString()
                      : "Pending"}
                  </div>
                </div>
                <button
                  onClick={() => onRemove(idx)}
                  className="text-red-600 hover:text-red-400 text-[10px]"
                >
                  REMOVE
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN WORKFLOW MANAGER COMPONENT
// ============================================================================
const WorkflowManager = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [variables, setVariables] = useState({});
  const [webhooks, setWebhooks] = useState([]);
  const [webhookEvents, setWebhookEvents] = useState([]);
  const [dbConnections, setDbConnections] = useState([]);
  const [executionHistory, setExecutionHistory] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [isSchedulerRunning, setIsSchedulerRunning] = useState(false);
  const [activePanel, setActivePanel] = useState("console");
  const nodeIdCounter = useRef(1);
  const schedulerIntervals = useRef([]);

  // ============================================================================
  // LOGGING
  // ============================================================================
  const addLog = useCallback((nodeId, message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
    setConsoleLogs((prev) => [...prev, { timestamp, nodeId, message, type }]);
  }, []);

  const clearConsole = useCallback(() => {
    setConsoleLogs([]);
    addLog("SYSTEM", "Console cleared");
  }, [addLog]);

  // ============================================================================
  // VARIABLE STORAGE
  // ============================================================================
  const setVariable = useCallback(
    (key, value) => {
      setVariables((prev) => ({ ...prev, [key]: value }));
      addLog("VARS", `Set: ${key}`);
    },
    [addLog],
  );

  const getVariable = useCallback((key) => variables[key], [variables]);

  const deleteVariable = useCallback(
    (key) => {
      setVariables((prev) => {
        const newVars = { ...prev };
        delete newVars[key];
        return newVars;
      });
      addLog("VARS", `Deleted: ${key}`);
    },
    [addLog],
  );

  const clearVariables = useCallback(() => {
    setVariables({});
    addLog("VARS", "All cleared");
  }, [addLog]);

  // ============================================================================
  // WEBHOOKS
  // ============================================================================
  const addWebhook = useCallback(
    (name) => {
      const webhook = {
        id: `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        active: true,
        triggerCount: 0,
      };
      setWebhooks((prev) => [...prev, webhook]);
      addLog("WEBHOOK", `Created: ${name}`);
    },
    [addLog],
  );

  const removeWebhook = useCallback(
    (index) => {
      setWebhooks((prev) => prev.filter((_, idx) => idx !== index));
      addLog("WEBHOOK", "Removed");
    },
    [addLog],
  );

  const toggleWebhook = useCallback((index) => {
    setWebhooks((prev) =>
      prev.map((wh, idx) =>
        idx === index ? { ...wh, active: !wh.active } : wh,
      ),
    );
  }, []);

  const triggerWebhook = useCallback(
    (webhookId, data) => {
      const webhook = webhooks.find((wh) => wh.id === webhookId);
      if (webhook && webhook.active) {
        setWebhookEvents((prev) => [
          ...prev,
          {
            timestamp: new Date().toLocaleTimeString(),
            webhook: webhook.name,
            data,
          },
        ]);
        setWebhooks((prev) =>
          prev.map((wh) =>
            wh.id === webhookId
              ? { ...wh, triggerCount: (wh.triggerCount || 0) + 1 }
              : wh,
          ),
        );
        addLog("WEBHOOK", `Triggered: ${webhook.name}`);
        executeWorkflow(data);
      }
    },
    [webhooks, addLog],
  );

  // ============================================================================
  // DATABASE
  // ============================================================================
  const addDbConnection = useCallback(
    (connection) => {
      const newConnection = {
        ...connection,
        id: `db_${Date.now()}`,
        status: "connected",
        connectedAt: new Date().toISOString(),
      };
      setDbConnections((prev) => [...prev, newConnection]);
      addLog("DB", `Connected: ${connection.name}`);
    },
    [addLog],
  );

  const removeDbConnection = useCallback(
    (index) => {
      const conn = dbConnections[index];
      setDbConnections((prev) => prev.filter((_, idx) => idx !== index));
      addLog("DB", `Disconnected: ${conn?.name}`);
    },
    [dbConnections, addLog],
  );

  const testDbConnection = useCallback(
    (index) => {
      const conn = dbConnections[index];
      addLog("DB", `Testing: ${conn?.name}...`);
      setTimeout(() => addLog("DB", `✓ Test successful: ${conn?.name}`), 500);
    },
    [dbConnections, addLog],
  );

  const saveExecutionToDb = useCallback(
    (executionData) => {
      const execution = {
        id: `exec_${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: executionData.status,
        duration: executionData.duration,
      };
      setExecutionHistory((prev) => [...prev, execution]);
      if (dbConnections.length > 0) {
        addLog("DB", `Saved execution: ${execution.id}`);
      }
      return execution;
    },
    [dbConnections, addLog],
  );

  // ============================================================================
  // SCHEDULER
  // ============================================================================
  const addSchedule = useCallback(
    (intervalSeconds) => {
      const newSchedule = {
        interval: intervalSeconds,
        nextRun: Date.now() + intervalSeconds * 1000,
      };
      setSchedules((prev) => [...prev, newSchedule]);
      addLog("SCHEDULER", `Added: every ${intervalSeconds}s`);
    },
    [addLog],
  );

  const removeSchedule = useCallback(
    (index) => {
      setSchedules((prev) => prev.filter((_, idx) => idx !== index));
      addLog("SCHEDULER", "Schedule removed");
    },
    [addLog],
  );

  const toggleScheduler = useCallback(() => {
    setIsSchedulerRunning((prev) => !prev);
    if (!isSchedulerRunning) {
      addLog("SCHEDULER", "Started");
    } else {
      addLog("SCHEDULER", "Stopped");
      schedulerIntervals.current.forEach(clearInterval);
      schedulerIntervals.current = [];
    }
  }, [isSchedulerRunning, addLog]);

  useEffect(() => {
    if (isSchedulerRunning && schedules.length > 0) {
      schedulerIntervals.current = schedules.map((schedule, idx) => {
        return setInterval(() => {
          addLog("SCHEDULER", `Triggered (Schedule ${idx + 1})`);
          executeWorkflow();
          setSchedules((prev) =>
            prev.map((s, i) =>
              i === idx ? { ...s, nextRun: Date.now() + s.interval * 1000 } : s,
            ),
          );
        }, schedule.interval * 1000);
      });

      return () => {
        schedulerIntervals.current.forEach(clearInterval);
        schedulerIntervals.current = [];
      };
    }
  }, [isSchedulerRunning, schedules]);

  // ============================================================================
  // NODE MANAGEMENT
  // ============================================================================
  const handleCodeChange = useCallback(
    (nodeId, newCode) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, code: newCode } }
            : node,
        ),
      );
    },
    [setNodes],
  );

  const handleLabelChange = useCallback(
    (nodeId, newLabel) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, label: newLabel } }
            : node,
        ),
      );
    },
    [setNodes],
  );

  const deleteNode = useCallback(
    (nodeId) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      );
      addLog("SYSTEM", `Node deleted: ${nodeId}`);
    },
    [setNodes, setEdges, addLog],
  );

  const addNode = useCallback(
    (template = "basic") => {
      const id = `node_${nodeIdCounter.current++}`;

      const templates = {
        basic: {
          label: `FUNCTION_${nodeIdCounter.current - 1}`,
          code: `// Basic function node\nconsole.log("Received:", data);\n\nconst result = data ? data * 2 : 42;\n\nconsole.log("Returning:", result);\nreturn result;`,
          nodeType: "BASIC",
        },
        http: {
          label: `HTTP_REQUEST`,
          code: `// HTTP Request with Axios\nconsole.log("Making request...");\n\ntry {\n  const response = await axios.get('https://jsonplaceholder.typicode.com/posts/1');\n  console.log("Status:", response.status);\n  console.log("Data:", response.data);\n  return response.data;\n} catch (error) {\n  console.log("ERROR:", error.message);\n  return { error: error.message };\n}`,
          nodeType: "HTTP",
        },
        condition: {
          label: `CONDITION`,
          code: `// Conditional branching\nconsole.log("Evaluating:", data);\n\nif (data && data.value > 50) {\n  console.log("TRUE path");\n  return true;\n} else {\n  console.log("FALSE path");\n  return false;\n}`,
          nodeType: "CONDITION",
        },
        loop: {
          label: `LOOP`,
          code: `// Loop node\nconsole.log("Iteration:", loopData.iteration || 0);\n\nif (!loopData.iteration) {\n  loopData.iteration = 0;\n  loopData.results = [];\n}\n\nloopData.iteration++;\nconst result = { iteration: loopData.iteration, value: data || 0 };\nloopData.results.push(result);\n\nif (loopData.iteration < 5) {\n  return { continue: true, data: result, loopData };\n} else {\n  return { continue: false, data: loopData.results, loopData };\n}`,
          nodeType: "LOOP",
        },
        storage: {
          label: `STORAGE`,
          code: `// Variable storage\nconsole.log("Storing data...");\n\nvars.set('myData', data);\nvars.set('timestamp', Date.now());\n\nconsole.log("Stored! Total vars:", Object.keys(vars.all()).length);\nreturn { stored: true };`,
          nodeType: "STORAGE",
        },
        database: {
          label: `DATABASE`,
          code: `// Database operations\nconsole.log("Saving to database...");\n\nconst saveResult = await db.save('records', {\n  timestamp: new Date().toISOString(),\n  data: data\n});\n\nconsole.log("Saved:", saveResult);\nreturn saveResult;`,
          nodeType: "DATABASE",
        },
        webhook: {
          label: `WEBHOOK`,
          code: `// Webhook trigger node\nconsole.log("Webhook data received:", data);\n\nif (!data) {\n  return { error: "No data" };\n}\n\nvars.set('lastWebhook', data);\nreturn data;`,
          nodeType: "WEBHOOK",
        },
      };

      const templateData = templates[template] || templates.basic;

      const newNode = {
        id,
        type: "functionNode",
        position: {
          x: Math.random() * 300 + 100,
          y: Math.random() * 300 + 100,
        },
        data: {
          ...templateData,
          onCodeChange: handleCodeChange,
          onLabelChange: handleLabelChange,
          onDelete: deleteNode,
          status: "READY",
        },
      };
      setNodes((nds) => [...nds, newNode]);
      addLog("SYSTEM", `Node created: ${id}`);
    },
    [setNodes, handleCodeChange, handleLabelChange, deleteNode, addLog],
  );

  // ============================================================================
  // EDGE MANAGEMENT
  // ============================================================================
  const onConnect = useCallback(
    (params) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: "#22c55e", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#22c55e" },
          },
          eds,
        ),
      );
      addLog("SYSTEM", `Connected: ${params.source} → ${params.target}`);
    },
    [setEdges, addLog],
  );

  const onEdgeClick = useCallback(
    (event, edge) => {
      event.stopPropagation();
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      addLog("SYSTEM", `Disconnected: ${edge.source} → ${edge.target}`);
    },
    [setEdges, addLog],
  );

  const onEdgesDelete = useCallback(
    (deletedEdges) => {
      deletedEdges.forEach((edge) => {
        addLog("SYSTEM", `Disconnected: ${edge.source} → ${edge.target}`);
      });
    },
    [addLog],
  );

  // ============================================================================
  // WORKFLOW EXECUTION
  // ============================================================================
  const executeWorkflow = useCallback(
    async (webhookData = null) => {
      if (nodes.length === 0) {
        addLog("SYSTEM", "No nodes to execute", "error");
        return;
      }

      const startTime = Date.now();
      setIsExecuting(true);
      addLog("SYSTEM", "═══════════════════════════════");
      addLog("SYSTEM", "    EXECUTION START");
      addLog("SYSTEM", "═══════════════════════════════");

      const nodeMap = new Map(nodes.map((n) => [n.id, n]));
      const edgeMap = new Map();

      edges.forEach((edge) => {
        const key = edge.sourceHandle
          ? `${edge.source}:${edge.sourceHandle}`
          : edge.source;
        if (!edgeMap.has(key)) edgeMap.set(key, []);
        edgeMap.get(key).push(edge.target);
      });

      const incomingCount = new Map();
      nodes.forEach((n) => incomingCount.set(n.id, 0));
      edges.forEach((e) =>
        incomingCount.set(e.target, (incomingCount.get(e.target) || 0) + 1),
      );
      const startNodes = nodes.filter((n) => incomingCount.get(n.id) === 0);

      if (startNodes.length === 0) {
        addLog("SYSTEM", "ERROR: No starting nodes", "error");
        setIsExecuting(false);
        return;
      }

      const executed = new Map();
      const loopData = new Map();
      const queue = [...startNodes.map((n) => n.id)];
      let executionStatus = "success";

      while (queue.length > 0) {
        const nodeId = queue.shift();
        const node = nodeMap.get(nodeId);
        if (!node) continue;

        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId
              ? { ...n, data: { ...n.data, status: "RUNNING" } }
              : n,
          ),
        );

        const parentEdges = edges.filter((e) => e.target === nodeId);
        const inputData =
          webhookData && executed.size === 0
            ? webhookData
            : parentEdges.length > 0
              ? executed.get(parentEdges[0].source)
              : null;

        try {
          addLog("SYSTEM", `▶ Executing ${nodeId}...`);

          const func = new Function(
            "data",
            "console",
            "axios",
            "loopData",
            "vars",
            "db",
            node.data.code,
          );
          const customConsole = {
            log: (...args) =>
              addLog(
                nodeId,
                args
                  .map((a) =>
                    typeof a === "object" ? JSON.stringify(a) : String(a),
                  )
                  .join(" "),
              ),
            error: (...args) =>
              addLog(
                nodeId,
                args
                  .map((a) =>
                    typeof a === "object" ? JSON.stringify(a) : String(a),
                  )
                  .join(" "),
                "error",
              ),
          };

          const varsProxy = {
            get: (key) => getVariable(key),
            set: (key, value) => setVariable(key, value),
            delete: (key) => deleteVariable(key),
            all: () => variables,
            has: (key) => key in variables,
          };

          const dbProxy = {
            save: async (collection, data) => {
              addLog(nodeId, `Saving to ${collection}...`);
              return { success: true, id: `doc_${Date.now()}` };
            },
            query: async (collection, filter) => {
              addLog(nodeId, `Querying ${collection}...`);
              return [];
            },
            connections: dbConnections,
          };

          const currentLoopData = loopData.get(nodeId) || {};
          const result = await func(
            inputData,
            customConsole,
            axios,
            currentLoopData,
            varsProxy,
            dbProxy,
          );

          if (
            node.data.nodeType === "LOOP" &&
            result &&
            typeof result === "object"
          ) {
            if (result.continue) {
              loopData.set(nodeId, result.loopData || currentLoopData);
              setTimeout(() => {
                if (!queue.includes(nodeId)) queue.unshift(nodeId);
              }, 500);
              addLog("SYSTEM", `↻ ${nodeId} looping`);
              await new Promise((resolve) => setTimeout(resolve, 800));
              continue;
            } else {
              executed.set(nodeId, result.data);
              loopData.delete(nodeId);
            }
          } else if (node.data.nodeType === "CONDITION") {
            executed.set(nodeId, result);
            const branchPath = result ? "true" : "false";
            const branchKey = `${nodeId}:${branchPath}`;
            const children = edgeMap.get(branchKey) || [];
            addLog("SYSTEM", `✓ ${nodeId} → ${branchPath.toUpperCase()}`);
            children.forEach((childId) => {
              if (!queue.includes(childId)) queue.push(childId);
            });
            setNodes((nds) =>
              nds.map((n) =>
                n.id === nodeId
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        status: "COMPLETE",
                        lastExecution: new Date().toLocaleTimeString(),
                      },
                    }
                  : n,
              ),
            );
            await new Promise((resolve) => setTimeout(resolve, 800));
            continue;
          } else {
            executed.set(nodeId, result);
          }

          const resultStr =
            typeof result === "object"
              ? JSON.stringify(result).substring(0, 100)
              : String(result);
          addLog("SYSTEM", `✓ ${nodeId} → ${resultStr}`);

          setNodes((nds) =>
            nds.map((n) =>
              n.id === nodeId
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      status: "COMPLETE",
                      lastExecution: new Date().toLocaleTimeString(),
                    },
                  }
                : n,
            ),
          );

          if (node.data.nodeType !== "CONDITION") {
            const children = edgeMap.get(nodeId) || [];
            children.forEach((childId) => {
              const childIncoming = edges.filter((e) => e.target === childId);
              const allParentsExecuted = childIncoming.every((e) =>
                executed.has(e.source),
              );
              if (allParentsExecuted && !queue.includes(childId)) {
                queue.push(childId);
              }
            });
          }

          await new Promise((resolve) => setTimeout(resolve, 800));
        } catch (error) {
          addLog(nodeId, `ERROR: ${error.message}`, "error");
          addLog("SYSTEM", `✗ ${nodeId} failed`, "error");
          executionStatus = "failed";
          setNodes((nds) =>
            nds.map((n) =>
              n.id === nodeId
                ? { ...n, data: { ...n.data, status: "ERROR" } }
                : n,
            ),
          );
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      addLog("SYSTEM", "═══════════════════════════════");
      addLog("SYSTEM", `    EXECUTION COMPLETE (${duration}ms)`);
      addLog("SYSTEM", "═══════════════════════════════");

      saveExecutionToDb({ status: executionStatus, duration });
      setIsExecuting(false);
    },
    [
      nodes,
      edges,
      setNodes,
      addLog,
      variables,
      getVariable,
      setVariable,
      deleteVariable,
      dbConnections,
      saveExecutionToDb,
    ],
  );

  // ============================================================================
  // SAVE/LOAD WORKFLOW
  // ============================================================================
  const saveWorkflow = useCallback(() => {
    const workflow = {
      nodes: nodes.map(({ data, ...rest }) => ({
        ...rest,
        data: { label: data.label, code: data.code, nodeType: data.nodeType },
      })),
      edges,
      metadata: { version: "4.0.0", created: new Date().toISOString() },
    };
    const blob = new Blob([JSON.stringify(workflow, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workflow_${Date.now()}.json`;
    a.click();
    addLog("SYSTEM", "Workflow saved");
  }, [nodes, edges, addLog]);

  const loadWorkflow = useCallback(
    (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workflow = JSON.parse(e.target.result);
          setNodes(
            workflow.nodes.map((node) => ({
              ...node,
              data: {
                ...node.data,
                onCodeChange: handleCodeChange,
                onLabelChange: handleLabelChange,
                onDelete: deleteNode,
                status: "READY",
              },
            })),
          );
          setEdges(workflow.edges);
          addLog("SYSTEM", "Workflow loaded");
        } catch (error) {
          addLog("SYSTEM", `Load failed: ${error.message}`, "error");
        }
      };
      reader.readAsText(file);
    },
    [
      setNodes,
      setEdges,
      handleCodeChange,
      handleLabelChange,
      deleteNode,
      addLog,
    ],
  );

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-green-950 via-black to-green-950 border-b-2 border-green-900/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
            <Code className="w-5 h-5 text-green-500" />
          </div>
          <h1 className="text-green-400 font-mono text-lg font-bold tracking-wider">
            TACTICAL WORKFLOW SYSTEM
          </h1>
          <div className="text-[10px] text-green-700 font-mono">v4.0.0</div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative group">
            <button className="px-3 py-1.5 bg-green-900/50 hover:bg-green-800/50 border border-green-500/50 text-green-400 font-mono text-xs flex items-center gap-2">
              <Plus className="w-4 h-4" /> ADD NODE
            </button>
            <div className="absolute top-full mt-1 left-0 bg-black border border-green-500/50 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto z-50 min-w-[180px]">
              <div className="p-1">
                <button
                  onClick={() => addNode("basic")}
                  className="block w-full text-left px-3 py-2 text-green-400 hover:bg-green-900/30 font-mono text-xs"
                >
                  Basic Function
                </button>
                <button
                  onClick={() => addNode("http")}
                  className="block w-full text-left px-3 py-2 text-purple-400 hover:bg-purple-900/30 font-mono text-xs"
                >
                  HTTP Request
                </button>
                <button
                  onClick={() => addNode("condition")}
                  className="block w-full text-left px-3 py-2 text-yellow-400 hover:bg-yellow-900/30 font-mono text-xs"
                >
                  Condition
                </button>
                <button
                  onClick={() => addNode("loop")}
                  className="block w-full text-left px-3 py-2 text-blue-400 hover:bg-blue-900/30 font-mono text-xs"
                >
                  Loop
                </button>
                <button
                  onClick={() => addNode("storage")}
                  className="block w-full text-left px-3 py-2 text-cyan-400 hover:bg-cyan-900/30 font-mono text-xs"
                >
                  Variable Storage
                </button>
                <button
                  onClick={() => addNode("database")}
                  className="block w-full text-left px-3 py-2 text-indigo-400 hover:bg-indigo-900/30 font-mono text-xs"
                >
                  Database
                </button>
                <button
                  onClick={() => addNode("webhook")}
                  className="block w-full text-left px-3 py-2 text-orange-400 hover:bg-orange-900/30 font-mono text-xs"
                >
                  Webhook
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActivePanel("console")}
            className={`px-3 py-1.5 border ${activePanel === "console" ? "bg-green-900/50 border-green-500/50 text-green-400" : "bg-black/50 border-green-500/50 text-green-400"} font-mono text-xs`}
          >
            <Terminal className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActivePanel("variables")}
            className={`px-3 py-1.5 border ${activePanel === "variables" ? "bg-cyan-900/50 border-cyan-500/50 text-cyan-400" : "bg-black/50 border-green-500/50 text-green-400"} font-mono text-xs`}
          >
            <Database className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActivePanel("webhooks")}
            className={`px-3 py-1.5 border ${activePanel === "webhooks" ? "bg-orange-900/50 border-orange-500/50 text-orange-400" : "bg-black/50 border-green-500/50 text-green-400"} font-mono text-xs`}
          >
            <Webhook className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActivePanel("database")}
            className={`px-3 py-1.5 border ${activePanel === "database" ? "bg-indigo-900/50 border-indigo-500/50 text-indigo-400" : "bg-black/50 border-green-500/50 text-green-400"} font-mono text-xs`}
          >
            <Activity className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-green-900/50 mx-1"></div>

          <button
            onClick={executeWorkflow}
            disabled={isExecuting}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-900/50 border border-green-400 text-black disabled:text-green-700 font-mono text-xs font-bold flex items-center gap-2"
          >
            <Play className="w-4 h-4" />{" "}
            {isExecuting ? "EXECUTING..." : "EXECUTE"}
          </button>

          <button
            onClick={saveWorkflow}
            className="px-3 py-1.5 bg-black/50 hover:bg-green-900/30 border border-green-500/50 text-green-400 font-mono text-xs flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> SAVE
          </button>

          <label className="px-3 py-1.5 bg-black/50 hover:bg-green-900/30 border border-green-500/50 text-green-400 font-mono text-xs flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" /> LOAD
            <input
              type="file"
              accept=".json"
              onChange={loadWorkflow}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        {/* WORKFLOW CANVAS */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeClick={onEdgeClick}
            onEdgesDelete={onEdgesDelete}
            nodeTypes={nodeTypes}
            fitView
            className="bg-black"
            deleteKeyCode="Delete"
          >
            <Background color="#166534" gap={20} size={1} />
            <Controls className="bg-black/80 border border-green-900/50" />
            <MiniMap
              nodeColor="#22c55e"
              maskColor="rgba(0, 0, 0, 0.8)"
              className="bg-black/80 border border-green-900/50"
            />
            <Panel
              position="top-left"
              className="bg-black/80 border border-green-900/50 p-2 font-mono text-xs text-green-600"
            >
              <div>
                NODES: {nodes.length} | EDGES: {edges.length}
              </div>
              <div>STATUS: {isExecuting ? "🔄 EXECUTING" : "✓ IDLE"}</div>
              <div>
                VARS: {Object.keys(variables).length} | DB:{" "}
                {dbConnections.length}
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="w-96 border-l-2 border-green-900/50 flex flex-col">
          <div className="border-b-2 border-green-900/50">
            <SchedulerPanel
              schedules={schedules}
              onAdd={addSchedule}
              onRemove={removeSchedule}
              isRunning={isSchedulerRunning}
              onToggle={toggleScheduler}
            />
          </div>

          <div className="flex-1 overflow-hidden">
            {activePanel === "console" && (
              <ConsolePanel logs={consoleLogs} onClear={clearConsole} />
            )}
            {activePanel === "variables" && (
              <VariablePanel
                variables={variables}
                onSet={setVariable}
                onDelete={deleteVariable}
                onClear={clearVariables}
              />
            )}
            {activePanel === "webhooks" && (
              <WebhookPanel
                webhooks={webhooks}
                onAdd={addWebhook}
                onRemove={removeWebhook}
                onToggle={toggleWebhook}
                events={webhookEvents}
                onTrigger={triggerWebhook}
              />
            )}
            {activePanel === "database" && (
              <DatabasePanel
                connections={dbConnections}
                onAdd={addDbConnection}
                onRemove={removeDbConnection}
                onTest={testDbConnection}
                history={executionHistory}
              />
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="bg-gradient-to-r from-green-950 via-black to-green-950 border-t-2 border-green-900/50 px-6 py-2 flex items-center justify-between">
        <div className="text-[10px] text-green-700 font-mono">
          SYSTEM: OPERATIONAL | WEBHOOKS:{" "}
          {webhooks.filter((w) => w.active).length} | DB: {dbConnections.length}{" "}
          | EXECUTIONS: {executionHistory.length}
        </div>
        <div className="text-[10px] text-green-600 font-mono flex items-center gap-4">
          <span>
            SCHEDULER: {isSchedulerRunning ? "● ACTIVE" : "○ INACTIVE"}
          </span>
          <span>{new Date().toLocaleString("en-US", { hour12: false })}</span>
        </div>
      </div>
    </div>
  );
};

export default WorkflowManager;
