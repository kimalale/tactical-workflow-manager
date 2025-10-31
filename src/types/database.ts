// Database Types
export type DatabaseType = "mongodb" | "postgresql" | "mysql" | "firebase";

// Database Operations
export type DatabaseOperation =
  // MongoDB/Firebase operations
  | "find"
  | "findOne"
  | "insert"
  | "insertMany"
  | "update"
  | "updateMany"
  | "delete"
  | "deleteMany"
  | "count"
  // SQL operations (PostgreSQL/MySQL)
  | "query";
type ConnectionStatus =
  | "idle"
  | "connected"
  | "disconnected"
  | "error"
  | "testing";
// Base connection config
export interface BaseConnectionType {
  id?: string;
  name: string;
  type: DatabaseType;
  connectionString?: string;
  status: ConnectionStatus;
  error?: string;
  createdAt?: string;
  connectedAt?: string;
}

export interface MongoDBConnectionType extends BaseConnectionType {
  type: "mongodb";
  connectionString: string;
  database: string;
}

export interface PostgreSQLConnectionType extends BaseConnectionType {
  type: "postgresql";
  connectionString?: string; // Allow usage of connection string or input fields
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
}

export interface MySQLConnectionType extends BaseConnectionType {
  type: "mysql";
  host: string;
  port?: number;
  database: string;
  user: string;
  password?: string;
}

export type DatabaseConnectionType =
  | MongoDBConnectionType
  | PostgreSQLConnectionType
  | MySQLConnectionType;

// API Operations options
export interface NoSQLOptions {
  collection: string;
  query?: Record<string, any>; // Use case for passing objects to database
  data?: Record<string, any> | Record<string, any>[]; // Allow to pass a single document or array;
}

export interface SQLOptions {
  sql: string;
  params?: any[]; // Allow to pass array of prepared statements, something like ["Jane Doe", "janedoe@email.com"] into INSERT INTO users $1, $2 ...
}

export type DatabaseOptions = NoSQLOptions | SQLOptions;

export function isNoSQLOptions(
  options: DatabaseOptions,
): options is NoSQLOptions {
  return "collection" in options;
}

export function isSQLOptions(options: DatabaseOptions): options is SQLOptions {
  return "sql" in options;
}

export function isMongoDBConfig(
  config: DatabaseConnectionType,
): config is MongoDBConnectionType {
  return config.type === "mongodb";
}

export function isPostgreSQLConfig(
  config: DatabaseConnectionType,
): config is PostgreSQLConnectionType {
  return config.type === "postgresql";
}

export function isMySQLConfig(
  config: DatabaseConnectionType,
): config is MySQLConnectionType {
  return config.type === "mysql";
}

// Request to execute database operation
export interface DatabaseExecuteRequest {
  connectionConfig: DatabaseConnectionType;
  operation: DatabaseOperation;
  options: DatabaseOptions;
}

// Response from database operation
export interface DatabaseExecuteResponse {
  success: boolean;
  result?: any;
  error?: string;
  operation?: DatabaseOperation;
  timestamp?: string;
}

// Test connection request
export interface DatabaseTestRequest {
  connectionConfig: DatabaseConnectionType;
}

// Test connection response
export interface DatabaseTestResponse {
  success: boolean;
  message?: string;
  type?: DatabaseType;
  error?: string;
}

// Operation return results type
// MongoDB find result
export interface MongoFindResult<T = any> {
  _id: string;
  [key: string]: T;
}

// MongoDB insert result
export interface MongoInsertResult {
  id: string;
  acknowledged?: boolean;
  insertedId?: string;
}

// MongoDB update result
export interface MongoUpdateResult {
  modifiedCount: number;
  matchedCount?: number;
  acknowledged?: boolean;
}

// MongoDB delete result
export interface MongoDeleteResult {
  deletedCount: number;
  acknowledged?: boolean;
}

// SQL query result (generic)
export type SQLQueryResult<T = any> = T[];
