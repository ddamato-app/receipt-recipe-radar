import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config";
import { logger } from "./logger";
import { requireApiKey } from "./middleware/auth";
import { invoiceRouter } from "./routes/invoices";
import { paymentRouter } from "./routes/payments";
import { contractRouter } from "./routes/contracts";
import { SageAdapter } from "./adapters";

export function createApp(adapter: SageAdapter): express.Application {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Request logging
  app.use((req, _res, next) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
  });

  // Health check – no auth required
  app.get("/health", async (_req, res) => {
    const sageOk = await adapter.healthCheck().catch(() => false);
    res.status(sageOk ? 200 : 503).json({
      status: sageOk ? "ok" : "degraded",
      sage: sageOk ? "connected" : "unreachable",
      adapter: config.sage.adapter,
      timestamp: new Date().toISOString(),
    });
  });

  // All routes below require API key
  app.use(requireApiKey);

  app.use("/invoices", invoiceRouter(adapter));
  app.use("/payments", paymentRouter(adapter));
  app.use("/contracts", contractRouter(adapter));

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // Error handler
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _next: express.NextFunction
    ) => {
      logger.error("Unhandled error", { err });
      res.status(500).json({ error: "Internal server error" });
    }
  );

  return app;
}
