import { Router, Request, Response } from "express";
import { SageAdapter, ListOptions } from "../adapters";
import { logger } from "../logger";

export function paymentRouter(adapter: SageAdapter): Router {
  const router = Router();

  /**
   * GET /payments
   * Query params: page, pageSize, fromDate, toDate, customerCode
   */
  router.get("/", async (req: Request, res: Response) => {
    try {
      const options: ListOptions = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        pageSize: req.query.pageSize
          ? parseInt(req.query.pageSize as string)
          : 50,
        fromDate: req.query.fromDate as string | undefined,
        toDate: req.query.toDate as string | undefined,
        customerCode: req.query.customerCode as string | undefined,
      };
      const payments = await adapter.listPayments(options);
      res.json({ data: payments, count: payments.length });
    } catch (err) {
      logger.error("GET /payments error", { err });
      res.status(500).json({ error: "Failed to retrieve payments" });
    }
  });

  /**
   * GET /payments/:id
   */
  router.get("/:id", async (req: Request, res: Response) => {
    try {
      const payment = await adapter.getPayment(req.params.id);
      res.json(payment);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("not found")) {
        res.status(404).json({ error: err.message });
      } else {
        logger.error("GET /payments/:id error", { id: req.params.id, err });
        res.status(500).json({ error: "Failed to retrieve payment" });
      }
    }
  });

  /**
   * GET /payments/summary/:customerCode
   * Returns a quick payment summary (total paid, outstanding) for a customer.
   */
  router.get(
    "/summary/:customerCode",
    async (req: Request, res: Response) => {
      try {
        const { customerCode } = req.params;
        const payments = await adapter.listPayments({
          customerCode,
          pageSize: 500,
        });

        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const currencies = [...new Set(payments.map((p) => p.currency))];

        res.json({
          customerCode,
          paymentCount: payments.length,
          totalPaid: parseFloat(totalPaid.toFixed(2)),
          currencies,
          recentPayments: payments.slice(0, 5),
        });
      } catch (err) {
        logger.error("GET /payments/summary/:customerCode error", {
          customerCode: req.params.customerCode,
          err,
        });
        res.status(500).json({ error: "Failed to retrieve payment summary" });
      }
    }
  );

  return router;
}
