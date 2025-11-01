import { Activity } from "lucide-react";
import { useState } from "react";
import type { ExecutionHistoryType } from "../types/misc";
import type {
  DatabaseConnectionType,
  DatabaseType,
  MongoDBConnectionType,
  MySQLConnectionType,
  PostgreSQLConnectionType,
} from "../types/database";

const DatabasePanel = ({
  connections,
  onAdd,
  onRemove,
  onTest,
  history,
}: {
  connections: DatabaseConnectionType[];
  onAdd: (connection: DatabaseConnectionType) => void;
  onRemove: (index: number) => void;
  onTest: (index: number) => void;
  history: ExecutionHistoryType[];
}) => {
  const [type, setType] = useState<DatabaseType>("mongodb");
  const [name, setName] = useState<string>("");
  const [connStr, setConnStr] = useState<string>("");
  const [showAdd, setShowAdd] = useState<boolean>(false);

  // MongoDB fields
  const [mongoUri, setMongoUri] = useState<string>("");
  const [mongoDb, setMongoDb] = useState<string>("");

  // PostgreSQL/MySQL fields
  const [host, setHost] = useState<string>("");
  const [port, setPort] = useState<string>("");
  const [database, setDatabase] = useState<string>("");
  const [user, setUser] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const handleAdd = () => {
    if (!name.trim()) return;

    if (type === "mongodb") {
      const config: MongoDBConnectionType = {
        name: name.trim(),
        type: "mongodb",
        status: "idle",
        connectionString: mongoUri,
        database: mongoDb,
      };
      onAdd(config);
    } else if (type === "postgresql" || type === "mysql") {
      const config: PostgreSQLConnectionType | MySQLConnectionType = {
        name: name.trim(),
        type: type === "postgresql" ? "postgresql" : "mysql",
        host: host,
        port: parseInt(port, 10) || (type === "postgresql" ? 5432 : 16500),
        connectionString:
          !connStr.trim() && type === "postgresql"
            ? `postgresql://${user}:${password}@${host}:${port}/${database}`
            : connStr,
        database: database,
        user: user,
        status: "idle",
        password: password,
      };
      onAdd(config);
    }

    setShowAdd(false);
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
        <div className="p-3 border-b border-green-900/30 bg-black/50 space-y-2 max-h-96 overflow-y-auto">
          <input
            type="text"
            placeholder="Connection name..."
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (type === "postgresql")
                setConnStr(
                  `postgresql://${user}:${password}@${host}:${port}/${database}`,
                );
            }}
            className="w-full bg-black border border-green-900/50 text-green-400 font-mono text-xs px-2 py-1 focus:border-green-500 focus:outline-none"
          />

          <select
            value={type}
            onChange={(e) => setType(e.target.value as DatabaseType)}
            className="w-full bg-black border border-green-900/50 text-green-400 font-mono text-xs px-2 py-1 focus:border-green-500 focus:outline-none"
          >
            <option value="mongodb">MongoDB</option>
            <option value="postgresql">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="firebase">Firebase</option>
          </select>

          {type === "mongodb" && (
            <>
              <input
                type="text"
                placeholder="mongodb://localhost:27017 or mongodb+srv://..."
                value={mongoUri}
                onChange={(e) => setMongoUri(e.target.value)}
                className="w-full bg-black border border-green-900/50 text-green-400 font-mono text-xs px-2 py-1 focus:border-green-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Database name"
                value={mongoDb}
                onChange={(e) => setMongoDb(e.target.value)}
                className="w-full bg-black border border-green-900/50 text-green-400 font-mono text-xs px-2 py-1 focus:border-green-500 focus:outline-none"
              />
            </>
          )}

          {type === "postgresql" && (
            <input
              type="text"
              placeholder="postgresql://localhost:5432..."
              value={connStr}
              onChange={(e) => setConnStr(e.target.value)}
              className="w-full bg-black border border-green-900/50 text-green-400 font-mono text-xs px-2 py-1 focus:border-green-500 focus:outline-none"
            />
          )}
          {(type === "postgresql" || type === "mysql") && (
            <>
              <input
                type="text"
                placeholder="Host (e.g., localhost)"
                value={host}
                onChange={(e) => {
                  setHost(e.target.value);
                  if (type === "postgresql") {
                    setConnStr(
                      `postgresql://${user}:${password}@${e.target.value}:${port}/${database}`,
                    );
                  }
                }}
                className="w-full bg-black border border-green-900/50 text-green-400 font-mono text-xs px-2 py-1 focus:border-green-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder={`Port (default: ${type === "postgresql" ? "5432" : "3306"})`}
                value={port}
                onChange={(e) => {
                  setPort(e.target.value);
                  if (type === "postgresql") {
                    setConnStr(
                      `postgresql://${user}:${password}@${host}:${e.target.value}/${database}`,
                    );
                  }
                }}
                className="w-full bg-black border border-green-900/50 text-green-400 font-mono text-xs px-2 py-1 focus:border-green-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Database name"
                value={database}
                onChange={(e) => {
                  setDatabase(e.target.value);
                  if (type === "postgresql") {
                    setConnStr(
                      `postgresql://${user}:${password}@${host}:${port}/${e.target.value}`,
                    );
                  }
                }}
                className="w-full bg-black border border-green-900/50 text-green-400 font-mono text-xs px-2 py-1 focus:border-green-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Username"
                value={user}
                onChange={(e) => {
                  setUser(e.target.value);
                  if (type === "postgresql") {
                    setConnStr(
                      `postgresql://${e.target.value}:${password}@${host}:${port}/${database}`,
                    );
                  }
                }}
                className="w-full bg-black border border-green-900/50 text-green-400 font-mono text-xs px-2 py-1 focus:border-green-500 focus:outline-none"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (type === "postgresql") {
                    setConnStr(
                      `postgresql://${user}:${e.target.value}@${host}:${port}/${database}`,
                    );
                  }
                }}
                className="w-full bg-black border border-green-900/50 text-green-400 font-mono text-xs px-2 py-1 focus:border-green-500 focus:outline-none"
              />
            </>
          )}

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
                  <div
                    className={`w-2 h-2 rounded-full ${
                      conn.status === "connected"
                        ? "bg-green-500"
                        : conn.status === "error"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                    }`}
                  ></div>
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
              {conn.status === "error" && (
                <div className="text-red-500 text-[10px] mt-1">
                  {conn.error}
                </div>
              )}
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

export default DatabasePanel;
