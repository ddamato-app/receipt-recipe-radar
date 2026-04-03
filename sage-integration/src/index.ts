import { config } from "./config";
import { logger } from "./logger";
import { createApp } from "./app";
import { createAdapter } from "./adapters";
import cron from "node-cron";
import http from "http";

async function main(): Promise<void> {
  logger.info("Starting SAGE 300 POS Integration Service", {
    adapter: config.sage.adapter,
    port: config.service.port,
  });

  const adapter = createAdapter();

  try {
    await adapter.connect();
  } catch (err) {
    logger.error("Failed to connect to SAGE 300 – starting in degraded mode", { err });
  }

  const app = createApp(adapter);
  const server = http.createServer(app);

  // Optional scheduled Supabase sync
  if (config.sync.enabled && config.sync.supabaseUrl && config.sync.supabaseServiceKey) {
    const { startSync } = await import("./sync");
    cron.schedule(config.sync.cronSchedule, () => {
      startSync(adapter).catch((err) =>
        logger.error("Scheduled sync failed", { err })
      );
    });
    logger.info("Scheduled Supabase sync enabled", {
      schedule: config.sync.cronSchedule,
    });
  }

  server.listen(config.service.port, "127.0.0.1", () => {
    logger.info(`Service listening on http://127.0.0.1:${config.service.port}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    server.close(async () => {
      await adapter.disconnect();
      logger.info("Service stopped");
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
