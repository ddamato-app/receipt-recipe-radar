import winston from "winston";
import path from "path";
import fs from "fs";
import { config } from "./config";

const logDir = config.logging.dir;
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

export const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length
            ? " " + JSON.stringify(meta)
            : "";
          return `${timestamp} [${level}]: ${message}${metaStr}`;
        })
      ),
    }),
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
    }),
  ],
});
