import { Request, Response, NextFunction } from "express";
import { config } from "../config";

/**
 * Simple API key authentication middleware.
 * Clients must pass the key as:
 *   Authorization: Bearer <api-key>
 *   OR
 *   X-API-Key: <api-key>
 */
export function requireApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers["authorization"];
  const headerKey = req.headers["x-api-key"] as string | undefined;

  let key: string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    key = authHeader.slice(7);
  } else if (headerKey) {
    key = headerKey;
  }

  if (!key || key !== config.service.apiKey) {
    res.status(401).json({ error: "Unauthorized – invalid or missing API key" });
    return;
  }

  next();
}
