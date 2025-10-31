import type {
  DatabaseConnectionType,
  DatabaseOperation,
  DatabaseOptions,
  DatabaseType,
  MongoDeleteResult,
  MongoInsertResult,
  MongoUpdateResult,
  SQLOptions,
  SQLQueryResult,
} from "./database";

export interface DatabaseProxyType {
  // Get connection by name
  getConnection: (name: string) => DatabaseConnectionType | undefined;

  // Execute generic query
  query: (
    connectionName: string,
    operation: DatabaseOperation,
    options: DatabaseOptions,
  ) => Promise<any>;

  // Helper methods for MongoDB/Firebase
  find: <T = any>(
    connectionName: string,
    collection: string,
    query?: Record<string, any>,
  ) => Promise<T[]>;

  findSQL: <T = any>(
    connectionName: string,
    sql: string,
    params: string[],
  ) => Promise<SQLQueryResult>;

  findOne: <T = any>(
    connectionName: string,
    collection: string,
    query?: Record<string, any>,
  ) => Promise<T | null>;

  insert: <T = any>(
    connectionName: string,
    collection: string,
    data: Record<string, any>,
  ) => Promise<MongoInsertResult>;

  insertSQL: <T = any>(
    connectionName: string,
    data: SQLOptions,
  ) => Promise<SQLQueryResult>;

  insertMany: (
    connectionName: string,
    collection: string,
    data: Record<string, any>[],
  ) => Promise<{ insertedCount: number; ids: string[] }>;

  update: (
    connectionName: string,
    collection: string,
    query: Record<string, any>,
    data: Record<string, any>,
  ) => Promise<MongoUpdateResult>;

  updateMany: (
    connectionName: string,
    collection: string,
    query: Record<string, any>,
    data: Record<string, any>,
  ) => Promise<MongoUpdateResult>;

  delete: (
    connectionName: string,
    collection: string,
    query: Record<string, any>,
  ) => Promise<MongoDeleteResult>;

  deleteMany: (
    connectionName: string,
    collection: string,
    query: Record<string, any>,
  ) => Promise<MongoDeleteResult>;

  count: (
    connectionName: string,
    collection: string,
    query?: Record<string, any>,
  ) => Promise<number>;

  // List available connections
  connections: Array<{
    name: string;
    type: DatabaseType;
    status: string;
  }>;
}
