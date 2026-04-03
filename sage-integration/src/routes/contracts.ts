import { Router, Request, Response } from "express";
import { SageAdapter, ListOptions } from "../adapters";
import { logger } from "../logger";

export function contractRouter(adapter: SageAdapter): Router {
  const router = Router();

  /**
   * GET /contracts
   * Query params: page, pageSize, customerCode, status
   */
  router.get("/", async (req: Request, res: Response) => {
    try {
      const options: ListOptions = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        pageSize: req.query.pageSize
          ? parseInt(req.query.pageSize as string)
          : 50,
        customerCode: req.query.customerCode as string | undefined,
        status: req.query.status as string | undefined,
      };
      const contracts = await adapter.listContracts(options);
      res.json({ data: contracts, count: contracts.length });
    } catch (err) {
      logger.error("GET /contracts error", { err });
      res.status(500).json({ error: "Failed to retrieve contracts" });
    }
  });

  /**
   * GET /contracts/:id
   */
  router.get("/:id", async (req: Request, res: Response) => {
    try {
      const contract = await adapter.getContract(req.params.id);
      res.json(contract);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("not found")) {
        res.status(404).json({ error: err.message });
      } else {
        logger.error("GET /contracts/:id error", { id: req.params.id, err });
        res.status(500).json({ error: "Failed to retrieve contract" });
      }
    }
  });

  /**
   * GET /contracts/:id/verify
   * Checks if a contract is currently valid (active, not expired).
   */
  router.get("/:id/verify", async (req: Request, res: Response) => {
    try {
      const result = await adapter.verifyContract(req.params.id);
      res.json({
        contractId: req.params.id,
        ...result,
        checkedAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("not found")) {
        res.status(404).json({ error: err.message });
      } else {
        logger.error("GET /contracts/:id/verify error", {
          id: req.params.id,
          err,
        });
        res.status(500).json({ error: "Failed to verify contract" });
      }
    }
  });

  return router;
}
