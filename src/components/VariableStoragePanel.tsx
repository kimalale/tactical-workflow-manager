import { Database } from "lucide-react";
import { useState } from "react";
import type { Variables } from "../types/misc";

const VariableStoragePanel = ({
  variables,
  onSetVariable,
  onDeleteVariable,
  onClear,
}: {
  variables: Variables;
  onSetVariable: (key: string, value: string) => void;
  onDeleteVariable: (key: string) => void;
  onClear: () => void;
}) => {
  const [newKey, setNewKey] = useState<string>("");
  const [newValue, setNewValue] = useState<string>("");
  const [showAdd, setShowAdd] = useState<boolean>(false);

  const handleAdd = () => {
    if (newKey.trim()) {
      try {
        const parsedValue = JSON.parse(newValue);
        onSetVariable(newKey.trim(), parsedValue);
      } catch {
        onSetVariable(newKey.trim(), newValue);
      }
      setNewKey("");
      setNewValue("");
      setShowAdd(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-black/90 border-2 border-green-900/50 rounded-sm">
      <div className="bg-gradient-to-r from-green-950/80 to-black/80 px-3 py-2 border-b border-green-900/30 flex items-center gap-2">
        <Database className="w-4 h-4 text-green-500" />
        <span className="text-green-400 font-mono text-xs font-bold tracking-wider">
          VARIABLE STORAGE
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
        <div className="p-3 border-b border-green-900/30 bg-black/50">
          <input
            type="text"
            placeholder="Variable name..."
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="w-full bg-black border border-green-900/50 text-green-400 font-mono text-xs px-2 py-1 mb-2 focus:border-green-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Value (JSON or string)..."
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="w-full bg-black border border-green-900/50 text-green-400 font-mono text-xs px-2 py-1 mb-2 focus:border-green-500 focus:outline-none"
          />
          <button
            onClick={handleAdd}
            className="w-full bg-green-900/50 hover:bg-green-800/50 border border-green-500/50 text-green-400 font-mono text-xs py-1"
          >
            SET VARIABLE
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-2">
        {Object.keys(variables).length === 0 ? (
          <div className="text-green-700">// No variables stored...</div>
        ) : (
          Object.entries(variables).map(([key, value]) => (
            <div
              key={key}
              className="bg-black/50 border border-green-900/30 p-2 rounded"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-green-500 font-bold">{key}</span>
                <button
                  onClick={() => onDeleteVariable(key)}
                  className="text-red-600 hover:text-red-400 text-[10px]"
                >
                  DELETE
                </button>
              </div>
              <div className="text-green-400 text-[10px] break-all">
                {typeof value === "object"
                  ? JSON.stringify(value, null, 2)
                  : String(value)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VariableStoragePanel;
