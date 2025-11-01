export type logType = {
  nodeId: string;
  timestamp?: string;
  type?: string | null;
  message: string;
};

export type themeType = {
  primary: string;
  secondary: string;
};

export type Template =
  | "basic"
  | "http"
  | "condition"
  | "loop"
  | "webhook"
  | "storage"
  | "database"
  | "table";

export type NODETYPE =
  | "BASIC"
  | "HTTP"
  | "CONDITION"
  | "LOOP"
  | "WEBHOOK"
  | "STORAGE"
  | "DATABASE";
export type Variables = Record<string, string>;
export type SchedulerType = {
  interval: number;
  nextRun: number;
};

export type ExecutionHistoryType = {
  id: string;
  timestamp: string;
  status: string;
  duration: number;
};

export interface WebhookType {
  id: string;
  name: string;
  active: boolean;
  triggerCount: number;
}

export interface NodeGroupsType {
  [groupId: string]: {
    id: string;
    name: string;
    color: string;
    nodeIds: string[];
    collapsed: boolean;
    position?: { x: number; y: number }; // Optional: to position collapsed groups
  };
}

export const NODE_TYPE_COLORS = {
  BASIC: {
    border: "border-green-500",
    bg: "bg-green-900/20",
    text: "text-green-400",
  },
  HTTP: {
    border: "border-purple-500",
    bg: "bg-purple-900/20",
    text: "text-purple-400",
  },
  CONDITION: {
    border: "border-yellow-500",
    bg: "bg-yellow-900/20",
    text: "text-yellow-400",
  },
  LOOP: {
    border: "border-blue-500",
    bg: "bg-blue-900/20",
    text: "text-blue-400",
  },
  STORAGE: {
    border: "border-cyan-500",
    bg: "bg-cyan-900/20",
    text: "text-cyan-400",
  },
  DATABASE: {
    border: "border-indigo-500",
    bg: "bg-indigo-900/20",
    text: "text-indigo-400",
  },
  WEBHOOK: {
    border: "border-orange-500",
    bg: "bg-orange-900/20",
    text: "text-orange-400",
  },
};
