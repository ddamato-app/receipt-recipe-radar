import { Router, Request, Response } from "express";
import PDFDocument from "pdfkit";
import { SageAdapter, ListOptions } from "../adapters";
import { logger } from "../logger";

export function invoiceRouter(adapter: SageAdapter): Router {
  const router = Router();

  /**
   * GET /invoices
   * Query params: page, pageSize, fromDate, toDate, customerCode, status
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
        status: req.query.status as string | undefined,
      };
      const invoices = await adapter.listInvoices(options);
      res.json({ data: invoices, count: invoices.length });
    } catch (err) {
      logger.error("GET /invoices error", { err });
      res.status(500).json({ error: "Failed to retrieve invoices" });
    }
  });

  /**
   * GET /invoices/:id
   */
  router.get("/:id", async (req: Request, res: Response) => {
    try {
      const invoice = await adapter.getInvoice(req.params.id);
      res.json(invoice);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("not found")) {
        res.status(404).json({ error: err.message });
      } else {
        logger.error("GET /invoices/:id error", { id: req.params.id, err });
        res.status(500).json({ error: "Failed to retrieve invoice" });
      }
    }
  });

  /**
   * GET /invoices/:id/download
   * Returns a PDF version of the invoice.
   */
  router.get("/:id/download", async (req: Request, res: Response) => {
    try {
      const invoice = await adapter.getInvoice(req.params.id);

      const doc = new PDFDocument({ margin: 50 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`
      );
      doc.pipe(res);

      // Header
      doc.fontSize(20).font("Helvetica-Bold").text("INVOICE", { align: "right" });
      doc.moveDown(0.5);

      doc.fontSize(10).font("Helvetica");
      doc.text(`Invoice #: ${invoice.invoiceNumber}`, { align: "right" });
      doc.text(`Date: ${invoice.date}`, { align: "right" });
      doc.text(`Due Date: ${invoice.dueDate}`, { align: "right" });
      doc.moveDown();

      // Customer
      doc.font("Helvetica-Bold").text("Bill To:");
      doc.font("Helvetica").text(invoice.customerName);
      doc.text(`Customer Code: ${invoice.customerCode}`);
      doc.moveDown();

      // Line items table header
      const tableTop = doc.y;
      const col = { item: 50, desc: 120, qty: 320, price: 390, total: 470 };

      doc.font("Helvetica-Bold").fontSize(9);
      doc.text("Item Code", col.item, tableTop);
      doc.text("Description", col.desc, tableTop);
      doc.text("Qty", col.qty, tableTop);
      doc.text("Unit Price", col.price, tableTop);
      doc.text("Total", col.total, tableTop);

      doc
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      let y = tableTop + 20;
      doc.font("Helvetica").fontSize(9);
      for (const line of invoice.lines) {
        doc.text(line.itemCode, col.item, y, { width: 65 });
        doc.text(line.description, col.desc, y, { width: 195 });
        doc.text(String(line.quantity), col.qty, y, { width: 65 });
        doc.text(
          `${invoice.currency} ${line.unitPrice.toFixed(2)}`,
          col.price,
          y,
          { width: 75 }
        );
        doc.text(
          `${invoice.currency} ${line.lineTotal.toFixed(2)}`,
          col.total,
          y,
          { width: 75 }
        );
        y += 18;
        if (y > 700) {
          doc.addPage();
          y = 50;
        }
      }

      // Totals
      doc
        .moveTo(350, y + 5)
        .lineTo(550, y + 5)
        .stroke();
      y += 15;
      doc.font("Helvetica").fontSize(10);
      doc.text("Subtotal:", 350, y);
      doc.text(`${invoice.currency} ${invoice.subtotal.toFixed(2)}`, 470, y);
      y += 16;
      doc.text("Tax:", 350, y);
      doc.text(`${invoice.currency} ${invoice.tax.toFixed(2)}`, 470, y);
      y += 16;
      doc.font("Helvetica-Bold");
      doc.text("Total:", 350, y);
      doc.text(`${invoice.currency} ${invoice.total.toFixed(2)}`, 470, y);
      y += 16;
      doc.text("Amount Due:", 350, y);
      doc.text(`${invoice.currency} ${invoice.amountDue.toFixed(2)}`, 470, y);

      // Status badge
      doc.moveDown(2);
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor(statusColor(invoice.status))
        .text(`Status: ${invoice.status.toUpperCase()}`, { align: "center" });

      doc.end();
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("not found")) {
        res.status(404).json({ error: err.message });
      } else {
        logger.error("GET /invoices/:id/download error", {
          id: req.params.id,
          err,
        });
        res.status(500).json({ error: "Failed to generate invoice PDF" });
      }
    }
  });

  return router;
}

function statusColor(status: string): string {
  switch (status) {
    case "paid":
      return "#16a34a";
    case "open":
      return "#2563eb";
    case "overdue":
      return "#dc2626";
    case "partial":
      return "#d97706";
    default:
      return "#6b7280";
  }
}
