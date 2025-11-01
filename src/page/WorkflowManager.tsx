import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MarkerType,
  MiniMap,
  Panel,
  useEdgesState,
  useNodesState,
} from "reactflow";
import ConsolePanel from "../components/ConsolePanel";
import {
  Activity,
  ActivityIcon,
  ClockPlus,
  Code,
  Cylinder,
  Database,
  DatabaseZap,
  GitBranch,
  Group,
  Package,
  Play,
  Plus,
  Repeat,
  Save,
  Spline,
  Square,
  Table,
  Terminal,
  Upload,
  Webhook,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import FunctionNode from "../components/FunctionNode";
import TableNode from "../components/TableNode";
import {
  type ExecutionHistoryType,
  type SchedulerType,
  type logType,
  type Template,
  type Variables,
  type WebhookType,
  type NodeGroupsType,
} from "../types/misc";
import "reactflow/dist/style.css";
import axios from "axios";
import VariableStoragePanel from "../components/VariableStoragePanel";
import SchedulerPanel from "../components/SchedulerPanel";
import DatabasePanel from "../components/DatabasePanel";
import type { DatabaseProxyType } from "../types/databaseProxy";
import type {
  DatabaseOperation,
  DatabaseConnectionType,
  DatabaseOptions,
  MongoDeleteResult,
  MongoInsertResult,
  MongoUpdateResult,
  SQLOptions,
  SQLQueryResult,
} from "../types/database";
import WebhookPanel from "../components/WebhookPanel";
import { NodeLibrary, type NodeTemplate } from "../components/NodeLibrary";
import GroupsPanel from "../components/GroupsPanel";
import GroupOverlays from "../components/GroupOverlays";
import CustomEdge from "../components/CustomEdge";
const nodeTypes = {
  functionNode: FunctionNode,
  tableNode: TableNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

// Main Workflow Manager Component
const WorkflowManager = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showNodeList, setShowNodeList] = useState<boolean>(false);
  const [nodeGroups, setNodeGroups] = useState<NodeGroupsType>({});
  const [showNodeLibrary, setShowNodeLibrary] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<logType[]>([]);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [variables, setVariables] = useState<Variables>({});
  const [webhooks, setWebhooks] = useState<WebhookType[]>([]);
  const [webhookEvents, setWebhookEvents] = useState([]);

  const [dbConnections, setDbConnections] = useState<DatabaseConnectionType[]>(
    [],
  );
  const [executionHistory, setExecutionHistory] = useState<
    ExecutionHistoryType[]
  >([]);
  const [schedules, setSchedules] = useState<SchedulerType[]>([]);
  const [isSchedulerRunning, setIsSchedulerRunning] = useState<boolean>(false);
  const [activePanel, setActivePanel] = useState<
    "console" | "variables" | "webhooks" | "database" | "groups"
  >("console");
  const nodeIdCounter = useRef(1);
  const schedulerIntervals = useRef<number[]>([]);

  // Add log to console
  const addLog = useCallback(({ nodeId, message, type = "info" }: logType) => {
    const timestamp = new Date().toLocaleTimeString("en-ZA", {
      hour12: false,
    });
    setConsoleLogs((prev) => [...prev, { timestamp, nodeId, message, type }]);
  }, []);

  // Control the add node drop download
  useEffect(() => {
    if (showNodeList) {
      setTimeout(() => {
        setShowNodeList(!showNodeList);
      }, 3000);
    }
  }, [showNodeList]);

  const testDatabaseConnection = useCallback(
    async (connection: DatabaseConnectionType) => {
      try {
        const response = await axios.post(
          "http://localhost:3001/api/database/test",
          {
            connectionConfig: {
              ...connection,
            },
          },
        );

        if (response.data.success) {
          setDbConnections((prev) =>
            prev.map((conn) =>
              conn.id === connection.id
                ? { ...conn, status: "connected" }
                : conn,
            ),
          );

          const DbTestSuccessLog = {
            nodeId: "DB",
            message: `Connected: ${connection.name}`,
          };
          addLog(DbTestSuccessLog);
        }
      } catch (error: any) {
        setDbConnections((prev) =>
          prev.map((conn) =>
            conn.id === connection.id
              ? { ...conn, status: "error", error: error.message }
              : conn,
          ),
        );

        const DbTestErrorLog = {
          nodeId: "DB",
          message: `Connection failed: ${connection.name}`,
          type: "error",
        };
        addLog(DbTestErrorLog);
      }
    },
    [addLog],
  );

  // Database Functions
  const addDbConnection = useCallback(
    (connection: DatabaseConnectionType) => {
      const newConnection: DatabaseConnectionType = {
        ...connection,
        id: `db_${Date.now()}`,
        status: "connected",
        connectedAt: new Date().toLocaleString("en-ZA"),
      };

      // Test connection first
      testDatabaseConnection(newConnection);

      setDbConnections((prev) => [...prev, newConnection]);

      const DbConnectedLog = {
        nodeId: "DB",
        message: `Connected: ${connection.name}`,
      };
      addLog(DbConnectedLog);
    },
    [addLog, testDatabaseConnection],
  );

  const removeDbConnection = useCallback(
    (index: number) => {
      const conn = dbConnections[index];
      setDbConnections((prev) => prev.filter((_, idx) => idx !== index));
      const DbDisconnectedLog = {
        nodeId: "DB",
        message: `Disconnected: ${conn?.name}`,
      };
      addLog(DbDisconnectedLog);
    },
    [dbConnections, addLog],
  );

  const testDbConnection = useCallback(
    (index: number) => {
      const conn = dbConnections[index];
      const DbTestConnectionLog = {
        nodeId: "DB",
        message: `Testing: ${conn?.name}...`,
      };
      addLog(DbTestConnectionLog);
      // setTimeout(() => addLog("DB", `✓ Test successful: ${conn?.name}`), 500);
    },
    [dbConnections, addLog],
  );

  const saveExecutionToDb = useCallback(
    ({ status, duration }: { status: string; duration: number }) => {
      const execution = {
        id: `exec_${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: status,
        duration: duration,
      };
      setExecutionHistory((prev) => [...prev, execution]);
      if (dbConnections.length > 0) {
        const DbSavedExecutionLog = {
          nodeId: "DB",
          message: `Saved execution: ${execution.id}`,
        };
        addLog(DbSavedExecutionLog);
      }
      return execution;
    },
    [dbConnections, addLog],
  );

  // setWebhookEvents
  const addWebhook = useCallback(
    (name: string) => {
      const webhook: WebhookType = {
        id: `wh_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name,
        active: true,
        triggerCount: 0,
      };

      setWebhooks((prev) => [...prev, webhook]);

      const webhookAddLog: logType = {
        nodeId: "WEBHOOK",
        message: `Created: ${name}`,
      };
      addLog(webhookAddLog);
    },
    [addLog],
  );

  const removeWebhook = useCallback(
    (index: number) => {
      setWebhooks((prev) => prev.filter((_, idx) => idx !== index));

      const webhookRemoveLog: logType = {
        nodeId: "WEBHOOK",
        message: "Removed",
      };
      addLog(webhookRemoveLog);
    },
    [addLog],
  );

  const toggleWebhook = useCallback((index: number) => {
    setWebhooks((prev) =>
      prev.map((wh, idx) =>
        idx === index ? { ...wh, active: !wh.active } : wh,
      ),
    );
  }, []);

  // Clear console
  const clearConsole = useCallback(() => {
    setConsoleLogs([]);
    const clearedLog: logType = {
      nodeId: "SYSTEM",
      message: "Console cleared",
    };
    addLog(clearedLog);
  }, [addLog]);

  // Variable Storage Functions
  const setVariable = useCallback(
    (key: string, value: string) => {
      setVariables((prev) => ({ ...prev, [key]: value }));
      const setVariableLog: logType = {
        nodeId: "STORAGE",
        message: `Variable set: ${key} = ${JSON.stringify(value).substring(0, 50)}`,
      };
      addLog(setVariableLog);
    },
    [addLog],
  );

  const getVariable = useCallback(
    (key: string) => {
      return variables[key];
    },
    [variables],
  );

  const deleteVariable = useCallback(
    (key: string) => {
      setVariables((prev) => {
        const newVars = { ...prev };
        delete newVars[key];
        return newVars;
      });

      const deletedVariableLog: logType = {
        nodeId: "STORAGE",
        message: `Variable deleted: ${key}`,
      };
      addLog(deletedVariableLog);
    },
    [addLog],
  );

  const clearVariables = useCallback(() => {
    setVariables({});
    const clearedVariblesLog: logType = {
      nodeId: "STORAGE",
      message: "All variables cleared",
    };

    addLog(clearedVariblesLog);
  }, [addLog]);

  // Scheduler Functions
  const addSchedule = useCallback(
    (intervalSeconds: number) => {
      const newSchedule = {
        interval: intervalSeconds,
        nextRun: Date.now() + intervalSeconds * 1000,
      };
      setSchedules((prev) => [...prev, newSchedule]);
      const newScheduleLog: logType = {
        nodeId: "SCHEDULER",
        message: `Schedule added: every ${intervalSeconds}s`,
      };
      addLog(newScheduleLog);
    },
    [addLog],
  );

  const removeSchedule = useCallback(
    (index: number) => {
      setSchedules((prev) => prev.filter((_, idx: number) => idx !== index));
      const removedScheduleLog: logType = {
        nodeId: "SCHEDULER",
        message: "Schedule removed",
      };
      addLog(removedScheduleLog);
    },
    [addLog],
  );

  const toggleScheduler = useCallback(() => {
    setIsSchedulerRunning((prev) => !prev);
    if (!isSchedulerRunning) {
      const startedScheduleLog: logType = {
        nodeId: "SCHEDULER",
        message: "Schedule started",
      };
      addLog(startedScheduleLog);
    } else {
      const stoppedScheduleLog: logType = {
        nodeId: "SCHEDULER",
        message: "Schedule stopped",
      };
      addLog(stoppedScheduleLog);
      schedulerIntervals.current.forEach(clearInterval);
      schedulerIntervals.current = [];
    }
  }, [isSchedulerRunning, addLog]);

  // Handle node code changes
  const handleCodeChange = useCallback(
    (nodeId: string, newCode: string) => {
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

  // Handle label changes
  const handleLabelChange = useCallback(
    (nodeId: string, newLabel: string) => {
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

  // Delete node
  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      );
      const deleteLog: logType = {
        nodeId: "SYSTEM",
        message: `Node ${nodeId} deleted`,
      };
      addLog(deleteLog);
    },
    [setNodes, setEdges, addLog],
  );

  // Add new node
  const addNode = useCallback(
    (template: Template) => {
      const id = `node_${nodeIdCounter.current++}`;

      // Create node templates
      const templates = {
        basic: {
          label: `FUNCTION_${nodeIdCounter.current - 1}`,
          code: `// Basic Function Node - You can build it up to do anything!
// Input: data from previous node
// Output: return value for the next node

// Sample Demo:
console.log("Received data: ", data)

const sampleResult = data & typeof data === 'number' ?
                    data * 2 : 2025;

console.log("Returning: ", sampleResult);
return sampleResult;
`,
          nodeType: "BASIC",
        },
        http: {
          label: `HTTP_REQUEST`,
          code: `
// HTTP Request Node
// Uses axios for API calls
// fetch() is also an option {-_0}

console.log("Making HTTP request...");

// Example GET request
const fetchData = async (url) => {

    try {
        const response = await axios.get(url);

        console.log("Response status:", response.status);
        console.log("Response data:", response.data);

        return response.data;
    } catch (error) {
        console.log("ERROR:", error.message);
        return {
            error: error.message
        };
    }
}

// Call fetch data function
return fetchData("https://api.restful-api.dev/objects");

// Example POST request:
/*
const postData = async () => {

    try {
        const postData = await axios.post('https://api.example.com/data', {
        key: 'value',
        data: data
        }, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer YOUR_TOKEN'
        }
        });
        return postData.data;

        return response.data;
    } catch (error) {
        console.log("ERROR:", error.message);
        return {
            error: error.message
        };
    }
}
*/
            `,
          nodeType: "HTTP",
        },
        condition: {
          label: `IF_CONDITION`,
          code: `
                // Conditional Branching Node
                // Return true or false to route data ReactFlow
                // TRUE goes to top output
                // False goes to bottom output

                console.log("Evaluating condition with data:", data);

                // Example: Check if value is greater than 50
                if (data && data.value > 50) {
                    console.log("Condition TRUE - route to true path")'
                    return true;
                } else {
                    console.log("Condition False - route to false path");
                    return false;
                }

                // Further examples:
                // return data && data.status.toLowerCase() === 'active';
                // return data && data.score >= 100;
                // return Array.isArray(data) && data.length > 0;
            `,
          nodeType: "CONDITION",
        },
        loop: {
          label: `LOOP_NODE`,
          code: `
                // Loop node
                // Executes multiple times based on condition
                // Use 'loopData' to access current iteration

                console.log("Loop iteration:", loopData.iteration || 0);

                // Initialize if first iteration
                if (!loopData.iteration) {
                    loopData.iteration = 0;
                    loopData.results = [];
                }

                loopData.iteration++

                // Your loop logic here
                const result = {
                    iteration: loopData.iteration,
                    value: data ? data * loopData.iteration : loopData.iteration
                };

                loopData.results.push(result);
                console.log("Current result:", result);

                // Continue looping? (return object with "continue" property)
                if (loopData.iteration < 5) {
                    console.log("Continue loop...")'
                    return { continue: true, data: result, loopData };
                } else {
                    console.log("Loop complete!");
                    return { continue: false, data: result, ;loopData };
                }
            `,
          nodeType: "LOOP",
        },
        webhook: {
          label: `WEBHOOK`,
          code: `
// Webhook trigger node
console.log("Webhook data received:", data);

if (!data) {
    return { error: "No data" };
}

vars.set('lastWebhook', data);

return data;`,
          nodeType: "WEBHOOK",
        },
        storage: {
          label: `STORAGE`,
          code: `
// Variable storage

console.log("Storing data...");
vars.set('myData', data);
vars.set('timestamp', Date.now());
console.log("Stored! Total vars:", Object.keys(vars.all()).length);
return { stored: true };
`,
          nodeType: "STORAGE",
        },
        database: {
          label: `DATABASE`,
          code: `
// Database operations

console.log("Interacting with database...");

const ConnectionName = "AB";
const TableName = "users";
const SQL = \`SELECT * from \${TableName}\`;
const findResult = await db.findSQL(ConnectionName, SQL);

const result = {
    tableName: TableName,
    data: findResult
}

return result;
`,
          nodeType: "DATABASE",
        },
        table: {
          label: `TABLE`,
          code: `
// Input: data from previous node
// Output: return data in desired manner
// Output structure:
//    {
//      tableName: "name",
//      tableColumns: ["colA", ..., "colX"],
//      data: {
//              "key(colA)": <value>,
//              ...,
//              "key(ColX)": <value>
//              }[]
//          }
//    }

// Sample Demo:
console.log("Received data: ", data)

const dataPresentation = {
    tableName: data && data.tableName ? data.tableName : "Invalid Table Name",
    tableColumns: Object.keys(data.data[0]),
    data: data.data
}

return dataPresentation || null;
          `,
          nodeType: `TABLE`,
        },
      };

      const templateData = templates[template] ?? templates.basic;

      const newNode = {
        id,
        type: template === "table" ? "tableNode" : "functionNode",
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
      const newNodeLog: logType = {
        nodeId: "SYSTEM",
        message: `Node ${id} created (${templateData.nodeType})`,
      };
      addLog(newNodeLog);
    },
    [setNodes, handleCodeChange, handleLabelChange, deleteNode, addLog],
  );

  // Create group from selected nodes
  const createGroup = useCallback(
    (selectedNodeIds: string[], groupName: string) => {
      // Validation
      if (selectedNodeIds.length === 0) {
        const noNodesLog: logType = {
          nodeId: "ERROR",
          message: "Cannot create group: No nodes selected",
        };

        addLog(noNodesLog);
      }

      if (!groupName) {
        const invalidGroupNameLog: logType = {
          nodeId: "ERROR",
          message: "Cannot create group: Name cannot be empty",
        };
        addLog(invalidGroupNameLog);
      }

      // Check if nodes are already in a group
      const existingGroup = Object.values(nodeGroups).find((group) =>
        group.nodeIds.some((id) => selectedNodeIds.includes(id)),
      );

      if (existingGroup) {
        const existingGroupLog: logType = {
          nodeId: "SYSTEM",
          message: `Some nodes already in group: ${existingGroup.name}`,
        };

        addLog(existingGroupLog);
      }

      const groupId = `group_${Date.now()}`;

      setNodeGroups((prev) => ({
        ...prev,
        [groupId]: {
          id: groupId,
          name: groupName,
          color: "#22c55e",
          nodeIds: selectedNodeIds,
          collapsed: false,
        },
      }));

      const createGroupLog: logType = {
        nodeId: "SYSTEM",
        message: `Created group: ${groupName}`,
      };

      addLog(createGroupLog);
    },
    [addLog, nodeGroups],
  );

  // Toggle group collapse
  const toggleGroupCollapse = useCallback(
    (groupId: string) => {
      if (!nodeGroups[groupId]) {
        const invalidGroupAccessLog: logType = {
          nodeId: "ERROR",
          message: `Group not found: ${groupId}`,
        };
        addLog(invalidGroupAccessLog);
      }
      setNodeGroups((prev) => ({
        ...prev,
        [groupId]: {
          ...prev[groupId],
          collasped: !prev[groupId].collapsed,
        },
      }));

      const newState: boolean = !nodeGroups[groupId].collapsed;
      const newGroupStateLog: logType = {
        nodeId: "SYSTEM",
        message: `GROUP "${nodeGroups[groupId].name}" ${newState ? "collapsed" : "expanded"}`,
      };
      addLog(newGroupStateLog);
    },
    [addLog, nodeGroups],
  );

  // Remove a node from its group
  const removeNodeFromGroup = useCallback(
    (nodeId: string) => {
      const groupEntry = Object.entries(nodeGroups).find(([_, group]) =>
        group.nodeIds.includes(nodeId),
      );

      if (!groupEntry) return;

      const [groupId, group] = groupEntry;
      const updatedNodeIds = group.nodeIds.filter((id) => id !== nodeId);

      if (updatedNodeIds.length === 0) {
        // Delete group if empty
        setNodeGroups((prev) => {
          const { [groupId]: _, ...rest } = prev;
          return rest;
        });

        const removeEmptyGroupLog: logType = {
          nodeId: "SYSTEM",
          message: `Deleted empty group: ${group.name}`,
        };
        addLog(removeEmptyGroupLog);
      } else {
        setNodeGroups((prev) => ({
          ...prev,
          [groupId]: { ...prev[groupId], nodeIds: updatedNodeIds },
        }));
        const removeNodeFromGroup: logType = {
          nodeId: "SYSTEM",
          message: `Remove node from group: ${group.name}`,
        };
        addLog(removeNodeFromGroup);
      }
    },
    [nodeGroups, addLog],
  );

  // Delete a group (but keep the nodes)
  const deleteGroup = useCallback(
    (groupId: string) => {
      if (!nodeGroups[groupId]) return;

      const groupName = nodeGroups[groupId].name;
      setNodeGroups((prev) => {
        const { [groupId]: _, ...rest } = prev;
        return rest;
      });
      const deleteGroupLog: logType = {
        nodeId: "SYSTEM",
        message: `Deleted group: ${groupName}`,
      };
      addLog(deleteGroupLog);
    },
    [nodeGroups, addLog],
  );

  // Rename a group
  const renameGroup = useCallback(
    (groupId: string, newName: string) => {
      if (!nodeGroups[groupId]) return;
      if (!newName.trim()) {
        const renameGroupEmptyNameLog: logType = {
          nodeId: "SYSTEM",
          message: "Group name cannot be empty",
        };
        addLog(renameGroupEmptyNameLog);
        return;
      }

      setNodeGroups((prev) => ({
        ...prev,
        [groupId]: { ...prev[groupId], name: newName.trim() },
      }));

      const renameGroupLog: logType = {
        nodeId: "SYSTEM",
        message: `Renamed group to: ${newName.trim()}`,
      };

      addLog(renameGroupLog);
    },
    [nodeGroups, addLog],
  );

  // Change group color
  const setGroupColor = useCallback(
    (groupId: string, color: string) => {
      if (!nodeGroups[groupId]) return;

      setNodeGroups((prev) => ({
        ...prev,
        [groupId]: { ...prev[groupId], color },
      }));
    },
    [nodeGroups],
  );

  // Get all nodes in a group
  const getGroupNodes = useCallback(
    (groupId: string) => {
      const group = nodeGroups[groupId];
      if (!group) return [];

      return group.nodeIds
        .map((id) => nodes.find((n) => n.id === id))
        .filter(Boolean);
    },
    [nodeGroups, nodes],
  );

  // Apply color to node
  // const getNodeColors = (nodeType: NODETYPE) => {
  //   return NODE_TYPE_COLORS[nodeType] || NODE_TYPE_COLORS.BASIC;
  // };

  // Handle edge connections
  const onConnect = useCallback(
    (params: any) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            id: `edge_${Date.now()}`,
            animated: true,
            style: { stroke: "#22c55e", strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#22c55e",
            },
            // Make edges deletable by default
            type: "custom",
          },
          eds,
        ),
      );

      const connectEdgeLog: logType = {
        nodeId: "SYSTEM",
        message: `Connected ${params.source} → ${params.target}`,
      };
      addLog(connectEdgeLog);
    },
    [setEdges, addLog],
  );

  // Handle edge click to delete
  const onEdgeClick = useCallback(
    (event: React.MouseEvent<Element, MouseEvent>, edge: any) => {
      event.stopPropagation();
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));

      const clickEdgeLog: logType = {
        nodeId: "SYSTEM",
        message: `Disconnected ${edge.source} → ${edge.target}`,
      };
      addLog(clickEdgeLog);
    },
    [setEdges, addLog],
  );

  // Handle edge update (when dragging edge to new target)
  const onEdgesDelete = useCallback(
    (deletedEdges: any[]) => {
      deletedEdges.forEach((edge: any) => {
        const deleteEdgeLog: logType = {
          nodeId: "SYSTEM",
          message: `Disconnected ${edge.source} → ${edge.target}`,
        };
        addLog(deleteEdgeLog);
      });
    },
    [addLog],
  );

  // Execute workflow
  // Improved with loop and if-confidion nodes
  const executeWorkflow = useCallback(
    async (webhookData = null) => {
      if (nodes.length === 0) {
        const noNodesLog: logType = {
          nodeId: "SYSTEM",
          message: "No nodes to execute",
          type: "error",
        };
        addLog(noNodesLog);
        return;
      }

      const startTime = Date.now();
      setIsExecuting(true);
      const executionBeginLog: logType = {
        nodeId: "SYSTEM",
        message: "~~~ EXECUTION START ~~~",
      };
      addLog(executionBeginLog);

      // Build execution graph
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));
      const edgeMap = new Map();

      // Build edge map with source handle support
      edges.forEach((edge) => {
        const key = edge.sourceHandle
          ? `${edge.source}:${edge.sourceHandle}`
          : edge.source;
        if (!edgeMap.has(key)) {
          edgeMap.set(key, []);
        }
        edgeMap.get(key).push(edge.target);
      });

      // Find starting nodes (nodes with no incoming edges)
      const incomingCount = new Map();
      nodes.forEach((n) => incomingCount.set(n.id, 0));
      edges.forEach((e) =>
        incomingCount.set(e.target, (incomingCount.get(e.target) || 0) + 1),
      );
      const startNodes = nodes.filter((n) => incomingCount.get(n.id) === 0);

      if (startNodes.length === 0) {
        const noStartNodeLog: logType = {
          nodeId: "SYSTEM",
          message: "ERROR: No starting nodes found (circular dependency?)",
          type: "error",
        };
        addLog(noStartNodeLog);
        setIsExecuting(false);
        return;
      }

      // Execute nodes in topological order
      const executed = new Map();
      const loopData = new Map(); // store our loop states
      const queue = [...startNodes.map((n) => n.id)];
      let executionStatus = "success"; // DB

      while (queue.length > 0) {
        const nodeId = queue.shift();
        const node = nodeMap.get(nodeId ?? "");

        if (!node) continue;

        // Update node status to running
        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    status: "RUNNING",
                    lastExecution: new Date().toLocaleTimeString(),
                  },
                }
              : n,
          ),
        );

        await new Promise((resolve) => setTimeout(resolve, 800));

        // Get input data from parent nodes
        const parentEdges = edges.filter((e) => e.target === nodeId);
        const inputData =
          webhookData && executed.size === 0
            ? webhookData
            : parentEdges.length > 0
              ? executed.get(parentEdges[0].source)
              : null;

        try {
          const executingLog: logType = {
            nodeId: "SYSTEM",
            message: `▶ Executing ${nodeId}...`,
          };

          addLog(executingLog);

          // Execute node function
          const func = new Function(
            "data",
            "console",
            "axios",
            "loopData",
            "vars",
            "db",
            `return (async () => { ${node.data.code} })();`,
          );
          const customConsole = {
            log: (...args: any) => {
              const placeholderLog: logType = {
                nodeId: node.data.label ?? "",
                message: args
                  .map((a: any) =>
                    typeof a === "object" ? JSON.stringify(a) : String(a),
                  )
                  .join(" "),
              };
              addLog(placeholderLog);
            },
            error: (...args) => {
              const placeholderLog: logType = {
                nodeId: nodeId ?? "",
                message: args
                  .map((a) =>
                    typeof a === "object" ? JSON.stringify(a) : String(a),
                  )
                  .join(" "),
                type: "error",
              };
              addLog(placeholderLog);
            },
          };

          // Variable storage object accessible in nodes
          const varsProxy = {
            get: (key: string) => getVariable(key),
            set: (key: string, value: string) => setVariable(key, value),
            delete: (key: string) => deleteVariable(key),
            all: () => variables,
            has: (key: string) => key in variables,
          };

          // Database storage object accessible in node
          const dbProxy: DatabaseProxyType = {
            // Get connection by name
            getConnection: (name: string) => {
              return dbConnections.find(
                (connection: DatabaseConnectionType) =>
                  connection.name === name,
              );
            },
            query: async (
              connectionName: string,
              operation: DatabaseOperation,
              options: DatabaseOptions,
            ) => {
              const connection = dbConnections.find(
                (conn) => conn.name === connectionName,
              );

              if (!connection) {
                throw new Error(
                  `Database connection not found: ${connectionName}`,
                );
              }

              try {
                // const data = {}
                const response = await axios.post(
                  "http://localhost:3001/api/database/execute",
                  {
                    connectionConfig: {
                      ...connection,
                    },
                    operation,
                    options,
                  },
                );

                if (response.data.success) {
                  return response.data.result;
                } else {
                  throw new Error(response.data.error);
                }
              } catch (error: any) {
                throw new Error(`Database operation failed: ${error.message}`);
              }
            },

            // Helper methods
            find: async (
              connectionName: string,
              collection: string,
              query = {},
            ): Promise<any[]> => {
              return await dbProxy.query(connectionName, "find", {
                collection,
                query,
              });
            },

            findSQL: async (
              connectionName: string,
              sql: string,
              params: string[],
            ): Promise<SQLQueryResult> => {
              return await dbProxy.query(connectionName, "query", {
                sql,
                params,
              });
            },

            findOne: async (
              connectionName: string,
              collection: string,
              query = {},
            ): Promise<any> => {
              return await dbProxy.query(connectionName, "find", {
                collection,
                query,
              });
            },

            insert: async (
              connectionName: string,
              collection: string,
              data: Record<string, any>,
            ): Promise<MongoInsertResult> => {
              return await dbProxy.query(connectionName, "insert", {
                collection,
                data,
              });
            },

            insertSQL: async (
              connectionName: string,
              data: SQLOptions,
            ): Promise<SQLQueryResult> => {
              return await dbProxy.query(connectionName, "query", data);
            },

            insertMany: async (
              connectionName: string,
              collection: string,
              data: Record<string, any>[],
            ): Promise<{ insertedCount: number; ids: string[] }> => {
              return await dbProxy.query(connectionName, "insert", {
                collection,
                data,
              });
            },

            update: async (
              connectionName: string,
              collection: string,
              query: Record<string, any>,
              data: Record<string, any>,
            ): Promise<MongoUpdateResult> => {
              return await dbProxy.query(connectionName, "update", {
                collection,
                query,
                data,
              });
            },

            updateMany: async (
              connectionName: string,
              collection: string,
              query: Record<string, any>,
              data: Record<string, any>,
            ): Promise<MongoUpdateResult> => {
              return await dbProxy.query(connectionName, "update", {
                collection,
                query,
                data,
              });
            },

            count: async (
              connectionName: string,
              collection: string,
              query?: Record<string, any>,
            ): Promise<number> => {
              return await dbProxy.query(connectionName, "count", {
                collection,
                query,
              });
            },

            delete: async (
              connectionName: string,
              collection: string,
              query: Record<string, any>,
            ): Promise<MongoDeleteResult> => {
              return await dbProxy.query(connectionName, "delete", {
                collection,
                query,
              });
            },

            deleteMany: async (
              connectionName: string,
              collection: string,
              query: Record<string, any>,
            ): Promise<MongoDeleteResult> => {
              return await dbProxy.query(connectionName, "delete", {
                collection,
                query,
              });
            },
            connections: dbConnections.map((conn) => ({
              name: conn.name,
              type: conn.type,
              status: conn.status,
            })),
          };

          // Get or initialise the loop data for this node
          const currentLoopData = loopData.get(nodeId) || {};

          const result = await func(
            inputData,
            customConsole,
            axios,
            currentLoopData,
            varsProxy,
            dbProxy,
          );

          // Handle loop nodes
          if (
            node.data.nodeType === "LOOP" &&
            result &&
            typeof result === "object"
          ) {
            if (result.continue) {
              // Store the loop state
              loopData.set(nodeId, result.loopData || currentLoopData);

              // Re-queue this node to continue loop
              setTimeout(() => {
                if (nodeId && !queue.includes(nodeId)) {
                  queue.unshift(nodeId);
                }
              }, 500);

              const iteration = result.loopData?.iteration ?? 0;
              const loopLog: logType = {
                nodeId: "SYSTEM",
                message: `↻ ${nodeId} looping (iteration ${iteration})`,
              };

              addLog(loopLog);
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === nodeId
                    ? { ...n, data: { ...n.data, loopCount: iteration } }
                    : n,
                ),
              );

              await new Promise((resolve) => setTimeout(resolve, 800));
              continue; // Don't proceed to children yet
            } else {
              // Loop is complete, use the final data
              executed.set(nodeId, result.data);
              loopData.delete(nodeId);
            }
          } else if (node.data.nodeType === "CONDITION") {
            // Handle conditional Branching
            executed.set(nodeId, result);

            const branchPath = result ? "true" : "false";
            const branchKey = `${nodeId}:${branchPath}`;
            const children = edgeMap.get(branchKey) || [];

            const branchLog: logType = {
              nodeId: "SYSTEM",
              message: `✓ ${nodeId} → ${branchPath.toUpperCase()} path`,
            };
            addLog(branchLog);

            children.forEach((childId: string) => {
              if (!queue.includes(childId)) {
                queue.push(childId);
              }
            });

            // Update node status
            setNodes((nds) =>
              nds.map((n) =>
                n.id === nodeId
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        status: "COMPLETE",
                        lastExecution: new Date().toLocaleTimeString(),
                        lastResult: result,
                      },
                    }
                  : n,
              ),
            );

            await new Promise((resolve) => setTimeout(resolve, 800));
            continue; // Skip normal child queueing
          } else {
            executed.set(nodeId, result);
          }

          const resultStr =
            typeof result === "object"
              ? JSON.stringify(result)
              : String(result);

          // Update the edge label to reflect returned data
          setEdges((edges) =>
            edges.map((edge) => {
              if (edge.source === nodeId) {
                return {
                  ...edge,
                  data: {
                    ...edge.data,
                    label: resultStr,
                    lastData: resultStr,
                  },
                };
              }
              return edge;
            }),
          );

          const executedLog: logType = {
            nodeId: "SYSTEM",
            message: `▶ ✓ ${nodeId} completed → ${resultStr}`,
          };
          addLog(executedLog);

          setNodes((nds) =>
            nds.map((n) =>
              n.id === nodeId
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      status: "COMPLETE",
                      lastExecution: new Date().toLocaleTimeString(),
                      lastResult: result,
                    },
                  }
                : n,
            ),
          );

          // Queue child nodes (for non-condition nodes)
          if (node.data.nodeType !== "CONDITION") {
            const children = edgeMap.get(nodeId) || [];
            children.forEach((childId: string) => {
              const childIncoming = edges.filter((e) => e.target === childId);
              const allParentsExecuted = childIncoming.every((e) =>
                executed.has(e.source),
              );
              if (allParentsExecuted && !queue.includes(childId)) {
                queue.push(childId);
              }
            });
          }

          // await new Promise((resolve) => setTimeout(resolve, 800));
        } catch (error: any) {
          const executingErrorLog: logType = {
            nodeId: nodeId ?? "",
            message: `▶ ✗ ${error.message}`,
            type: "error",
          };
          addLog(executingErrorLog);
          executingErrorLog.message = `▶ ✗ ${nodeId} failed`;
          addLog(executingErrorLog);
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

      const executingCompleteLog: logType = {
        nodeId: "SYSTEM",
        message: `▶ EXECUTION COMPLETE`,
      };
      addLog(executingCompleteLog);

      const endTime = Date.now();
      const duration = endTime - startTime;
      saveExecutionToDb({ status: executionStatus, duration });
      setIsExecuting(false);
    },
    [
      nodes,
      edges,
      setNodes,
      setEdges,
      addLog,
      variables,
      getVariable,
      setVariable,
      deleteVariable,
      dbConnections,
      saveExecutionToDb,
    ],
  );

  const triggerWebhook = useCallback(
    (webhookId: string, data: {}) => {
      const webhook: WebhookType = webhooks.find((wh) => wh.id === webhookId);

      if (webhook && webhook.active) {
        setWebhookEvents((prev) => [
          ...prev,
          {
            timestamp: new Date().toLocaleTimeString("en-ZA"),
            webhook: webhook.name,
            data,
          },
        ]);

        setWebhooks((prev) =>
          prev.map((wh) =>
            wh.id === webhookId
              ? { ...wh, triggerCount: (wh.triggerCount ?? 0) + 1 }
              : wh,
          ),
        );

        const triggerWebhookLog: logType = {
          nodeId: "WEBHOOK",
          message: `Triggered: ${webhook.name}`,
        };

        addLog(triggerWebhookLog);
        executeWorkflow(data);
      }
    },
    [webhooks, addLog, executeWorkflow],
  );

  // Run scheduler
  useEffect(() => {
    if (isSchedulerRunning && schedules.length > 0) {
      schedulerIntervals.current = schedules.map((schedule, idx) => {
        return setInterval(() => {
          const triggeredScheduleLog: logType = {
            nodeId: "SCHEDULER",
            message: `Triggered execution (Schedule ${idx + 1})`,
          };
          addLog(triggeredScheduleLog);
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
  }, [isSchedulerRunning, schedules, addLog, executeWorkflow]);

  // Save workflow
  const saveWorkflow = useCallback(() => {
    const workflow = {
      nodes: nodes.map(({ data, ...rest }) => ({
        ...rest,
        data: { label: data.label, code: data.code, nodeType: data.nodeType },
      })),
      edges,
      metadata: {
        version: "4.0.0",
        created: new Date().toISOString(),
      },
    };
    const blob = new Blob([JSON.stringify(workflow, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workflow_${Date.now()}.json`;
    a.click();
    const workflowSavedLog: logType = {
      nodeId: "SYSTEM",
      message: "▶ Workflow saved",
    };
    addLog(workflowSavedLog);
  }, [nodes, edges, addLog]);

  // Load workflow
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
          const workflowLoadedLog: logType = {
            nodeId: "SYSTEM",
            message: "▶ Workflow loaded successfully",
          };
          addLog(workflowLoadedLog);
        } catch (error: any) {
          const workflowSaveFailLog: logType = {
            nodeId: "SYSTEM",
            message: `▶ Failed to load workflow: ${error.message}`,
            type: "error",
          };
          addLog(workflowSaveFailLog);
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

  const importNodeTemplate = useCallback(
    (template: NodeTemplate) => {
      const id = `node_${nodeIdCounter.current++}`;

      const newNode = {
        id,
        type: "functionNode",
        position: {
          x: Math.random() * 300 + 100,
          y: Math.random() * 300 + 100,
        },
        data: {
          label: template.name,
          code: template.code,
          nodeType: "IMPORTED",
          onCodeChange: handleCodeChange,
          onLabelChange: handleLabelChange,
          onDelete: deleteNode,
          status: "READY",
        },
      };

      setNodes((nds) => [...nds, newNode]);
      const importNodeLog: logType = {
        nodeId: "SYSTEM",
        message: `Imported template: ${template.name}`,
      };
      addLog(importNodeLog);
    },
    [setNodes, handleCodeChange, handleLabelChange, deleteNode, addLog],
  );

  return (
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-950 via-black to-green-950 border-b-2 border-green-900/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
            <Code className="w-5 h-5 text-green-500" />
          </div>
          <h1 className="text-green-400 font-mono text-lg font-bold tracking-wider">
            TACTICAL WORKFLOW
          </h1>
          <div className="text-[10px] text-green-700 font-mono">v4.4</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button
              onClick={() => setShowNodeList(!showNodeList)}
              className={`px-3 py-1.5 border ${showNodeList ? "bg-green-900/50 border-green-500/80 text-green-400" : "bg-black/50 border-green-500/50 text-green-400"} hover:bg-green-800/50 font-mono text-xs flex items-center gap-2`}
            >
              <Plus
                className={`w-4 h-4 transition-transform duration-300 ${showNodeList && "rotate-[225deg]"}`}
              />{" "}
              ADD NODE
            </button>
            {showNodeList && (
              <div className="absolute top-full mt-1 left-0 bg-black border border-green-500/50 z-50 min-w-[180px]">
                <div className="p-1">
                  <button
                    onClick={() => addNode("basic")}
                    className="w-full whitespace-nowrap text-left px-3 py-2 text-green-400 hover:bg-green-900/30 font-mono text-xs flex items-center gap-2"
                  >
                    <Code className="w-3 h-3" /> Basic Function
                  </button>
                  <button
                    onClick={() => addNode("http")}
                    className="whitespace-nowrap w-full text-left px-3 py-2 text-purple-400 hover:bg-purple-900/30 font-mono text-xs flex items-center gap-2"
                  >
                    <Zap className="w-3 h-3" /> HTTP Request
                  </button>
                  <button
                    onClick={() => addNode("condition")}
                    className="whitespace-nowrap w-full text-left px-3 py-2 text-yellow-400 hover:bg-yellow-900/30 font-mono text-xs flex items-center gap-2"
                  >
                    <GitBranch className="w-3 h-3" /> Condition
                  </button>
                  <button
                    onClick={() => addNode("loop")}
                    className="whitespace-nowrap w-full text-left px-3 py-2 text-blue-400 hover:bg-blue-900/30 font-mono text-xs flex items-center gap-2"
                  >
                    <Repeat className="w-3 h-3" /> Loop
                  </button>
                  <button
                    onClick={() => addNode("webhook")}
                    className="whitespace-nowrap w-full text-left px-3 py-2 text-amber-400 hover:bg-amber-900/30 font-mono text-xs flex items-center gap-2"
                  >
                    <Webhook className="w-3 h-3" /> Webhook
                  </button>
                  <button
                    onClick={() => addNode("storage")}
                    className="whitespace-nowrap w-full text-left px-3 py-2 text-cyan-400 hover:bg-cyan-900/30 font-mono text-xs flex items-center gap-2"
                  >
                    <Database className="w-3 h-3" /> Variable Storage
                  </button>
                  <button
                    onClick={() => addNode("database")}
                    className="whitespace-nowrap w-full text-left px-3 py-2 text-indigo-400 hover:bg-indigo-900/30 font-mono text-xs flex items-center gap-2"
                  >
                    <Database className="w-3 h-3" /> Database
                  </button>
                  <button
                    onClick={() => addNode("table")}
                    className="whitespace-nowrap w-full text-left px-3 py-2 text-pink-400 hover:bg-pink-900/30 font-mono text-xs flex items-center gap-2"
                  >
                    <Table className="w-3 h-3" /> Table
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setActivePanel("variables")}
            className={`whitespace-nowrap flex items-center gap-2 px-3 py-1.5 border ${activePanel === "variables" ? "bg-cyan-900/50 border-cyan-500/80 text-cyan-400" : "bg-black/50 border-green-500/50 text-green-400 hover:bg-green-800/50"} font-mono text-xs`}
          >
            <DatabaseZap
              className={`w-4 h-4 transition-transform duration-700 ${activePanel === "variables" && "rotate-y-[360deg]"}`}
            />
            VARIABLES
          </button>
          <button
            onClick={() => setActivePanel("console")}
            className={`whitespace-nowrap flex items-center gap-2 px-3 py-1.5 border ${activePanel === "console" ? "bg-green-900/50 text-green-400" : "bg-black/50 border-green-500/50 text-green-400 hover:bg-green-800/50"} font-mono text-xs`}
          >
            <Terminal className="w-4 h-4" /> CONSOLE
          </button>
          <button
            onClick={() => setActivePanel("database")}
            className={`whitespace-nowrap flex items-center gap-2 px-3 py-1.5 border ${activePanel === "database" ? "bg-indigo-900/50 border-indigo-500/80 text-indigo-400" : "bg-black/50 border-green-500/50 text-green-400 hover:bg-green-800/50"} font-mono text-xs`}
          >
            <Activity className="w-4 h-4" /> DATABASE
          </button>
          <button
            onClick={() => setActivePanel("webhooks")}
            className={`whitespace-nowrap flex items-center gap-2 px-3 py-1.5 border ${activePanel === "webhooks" ? "bg-amber-900/50 border-amber-500/80 text-amber-400" : "bg-black/50 border-green-500/50 text-green-400 hover:bg-green-800/50"} font-mono text-xs`}
          >
            <Webhook className="w-4 h-4" /> WEBHOOK
          </button>
          <button
            onClick={() => setActivePanel("groups")}
            className={`whitespace-nowrap flex items-center gap-2 px-3 py-1.5 border ${
              activePanel === "groups"
                ? "bg-green-900/50 text-green-400"
                : "text-green-600 hover:bg-green-800/50"
            } font-mono text-xs`}
          >
            <Group className="w-4 h-4" />
            GROUPS
          </button>
          <button
            onClick={() => setShowNodeLibrary(true)}
            className="px-3 py-1.5 bg-purple-900/50 hover:bg-purple-800/50 border hover:border-purple-500/80 border-purple-500/50 text-purple-400 font-mono text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <Package className="w-4 h-4" /> MARKETPLACE/LIBRARY
          </button>
          <button
            onClick={() => executeWorkflow()}
            disabled={isExecuting}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-900/50 border border-green-400 text-black disabled:text-green-700 font-mono text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <Play className="w-4 h-4" />
            {isExecuting ? "EXECUTING..." : "EXECUTE"}
          </button>
          <button
            onClick={saveWorkflow}
            className="px-3 py-1.5 bg-black/50 hover:bg-green-900/30 border border-green-500/50 text-green-400 font-mono text-xs flex items-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            SAVE
          </button>
          <label className="px-3 py-1.5 bg-black/50 hover:bg-green-900/30 border border-green-500/50 text-green-400 font-mono text-xs flex items-center gap-2 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            LOAD
            <input
              type="file"
              accept=".json"
              onChange={loadWorkflow}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Workflow Canvas */}
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
            edgeTypes={edgeTypes}
            fitView
            className="bg-black"
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{
              type: "custom",
            }}
            deleteKeyCode="Delete"
          >
            <Background color="#166534" gap={20} size={1} />
            <Controls className="bg-black/80 border border-green-900/50" />
            <MiniMap
              nodeColor="#22c55e"
              maskColor="rgba(0, 0, 0, 0.8)"
              className="bg-black/80 border border-green-900/50"
            />
            {/* Group overlays - render behind nodes */}
            <GroupOverlays nodeGroups={nodeGroups} nodes={nodes} />
            <Panel
              position="top-left"
              className="bg-black/80 border border-green-900/50 p-2 font-mono text-xs text-green-600"
            >
              <div className="[&>div]:flex [&>div]:gap-2 text-base [&>div]:items-center">
                <div>
                  <Square
                    fill="#00a63e"
                    strokeWidth={1.2}
                    className="w-4 h-4"
                  />{" "}
                  {nodes.length}
                </div>
                <div>
                  <Spline
                    fill="#00a63e"
                    strokeWidth={1.2}
                    className="w-4 h-4"
                  />{" "}
                  {edges.length}
                </div>
                <div>
                  <ActivityIcon className="w-4 h-4" />{" "}
                  {isExecuting ? "● EXECUTING" : "● IDLE"}
                </div>
                <div>
                  <Database className="w-4 h-4" /> {dbConnections.length}
                </div>
                <div>
                  <Cylinder className="w-4 h-4" />{" "}
                  {Object.keys(variables).length}
                </div>
                <div>
                  <ClockPlus className="w-4 h-4" />{" "}
                  {isSchedulerRunning ? "● ON" : "○ OFF"}
                </div>
                <div>
                  <Group fill="#00a63e" className="w-4 h-4" />{" "}
                  {Object.keys(nodeGroups).length}
                </div>
              </div>
            </Panel>
            <Panel
              position="top-right"
              className="bg-black/80 ml-4 border border-green-900/50 p-2 font-mono text-[10px] text-green-700 space-y-1"
            >
              <div className="font-bold text-green-500 mb-1">INFO:</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500"></div> Basic Function
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500"></div> HTTP Request
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500"></div> Condition
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500"></div> Loop
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-500"></div> Storage
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500"></div> Webhook
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Right Sidebar */}
        <div className="w-96 border-l-2 border-green-900/50 flex flex-col">
          {/* Scheduler Panel */}
          <div className="border-b-2 border-green-900/50">
            <SchedulerPanel
              schedules={schedules}
              onAddSchedule={addSchedule}
              onRemoveSchedule={removeSchedule}
              isSchedulerRunning={isSchedulerRunning}
              onToggleScheduler={toggleScheduler}
            />
          </div>

          {/* Variables or Console */}
          <div className="flex-1 overflow-hidden">
            {activePanel === "console" && (
              <ConsolePanel logs={consoleLogs} onClear={clearConsole} />
            )}
            {activePanel === "variables" && (
              <VariableStoragePanel
                variables={variables}
                onSetVariable={setVariable}
                onDeleteVariable={deleteVariable}
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
            {showNodeLibrary && (
              <NodeLibrary
                onImportNode={importNodeTemplate}
                onClose={() => setShowNodeLibrary(false)}
              />
            )}
            {activePanel === "groups" && (
              <GroupsPanel
                groups={nodeGroups}
                nodes={nodes}
                selectedNodes={nodes.filter((n) => n.selected)}
                onCreateGroup={createGroup}
                onDeleteGroup={deleteGroup}
                onRenameGroup={renameGroup}
                onToggleCollapse={toggleGroupCollapse}
                onSetGroupColor={setGroupColor}
                onRemoveNodeFromGroup={removeNodeFromGroup}
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

      {/* Footer */}
      <div className="bg-gradient-to-r from-green-950 via-black to-green-950 border-t-2 border-green-900/50 px-6 py-2 flex items-center justify-between">
        <div className="text-[10px] text-green-700 font-mono">
          SYSTEM: OPERATIONAL | AXIOS: ENABLED | LOOPS: ACTIVE | CONDITIONS:
          ACTIVE | STORAGE: {Object.keys(variables).length} VARS | WEBHOOKS:{" "}
          {webhooks.filter((w) => w.active).length}| SCHEDULER:{" "}
          {isSchedulerRunning ? "ACTIVE" : "INACTIVE"}
        </div>
        <div className="text-[10px] text-green-600 font-mono">
          {new Date().toLocaleString("en-ZA", { hour12: false })}
        </div>
      </div>
    </div>
  );
};

export default WorkflowManager;
