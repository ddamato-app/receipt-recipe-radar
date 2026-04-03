import { config, AdapterType } from "../config";
import { SageAdapter } from "./types";
import { WebApiAdapter } from "./webApiAdapter";
import { SqlAdapter } from "./sqlAdapter";
import { OdbcAdapter } from "./odbcAdapter";

export function createAdapter(): SageAdapter {
  const type: AdapterType = config.sage.adapter;
  switch (type) {
    case "webapi":
      return new WebApiAdapter(config.sage.webapi);
    case "sqlserver":
      return new SqlAdapter(config.sage.sqlserver);
    case "odbc":
      return new OdbcAdapter(config.sage.odbc);
    default:
      throw new Error(
        `Unknown SAGE adapter type: "${type}". ` +
          `Valid options are: webapi, sqlserver, odbc`
      );
  }
}

export type { SageAdapter } from "./types";
export type { Invoice, Payment, Contract, ListOptions } from "./types";
