import fs from "fs";
import path from "path";

export type AdapterType = "webapi" | "sqlserver" | "odbc";

export interface WebApiConfig {
  baseUrl: string;
  username: string;
  password: string;
  companyId: string;
}

export interface SqlServerConfig {
  server: string;
  database: string;
  user: string;
  password: string;
  options: {
    encrypt: boolean;
    trustServerCertificate: boolean;
  };
}

export interface OdbcConfig {
  connectionString: string;
}

export interface AppConfig {
  service: {
    name: string;
    displayName: string;
    description: string;
    port: number;
    apiKey: string;
  };
  sage: {
    adapter: AdapterType;
    webapi: WebApiConfig;
    sqlserver: SqlServerConfig;
    odbc: OdbcConfig;
  };
  sync: {
    enabled: boolean;
    cronSchedule: string;
    supabaseUrl: string;
    supabaseServiceKey: string;
  };
  logging: {
    level: string;
    dir: string;
  };
}

function loadConfig(): AppConfig {
  const configPath =
    process.env.CONFIG_PATH ||
    path.join(process.cwd(), "config.json");

  if (!fs.existsSync(configPath)) {
    throw new Error(
      `Config file not found at ${configPath}. ` +
        `Copy config.example.json to config.json and fill in your values.`
    );
  }

  const raw = fs.readFileSync(configPath, "utf-8");
  return JSON.parse(raw) as AppConfig;
}

export const config = loadConfig();
