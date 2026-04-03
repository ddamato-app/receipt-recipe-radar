import { createClient } from "@supabase/supabase-js";
import { config } from "./config";
import { logger } from "./logger";
import { SageAdapter } from "./adapters";

/**
 * Optional Supabase sync – pushes SAGE 300 data into Supabase tables.
 * Runs on the cron schedule defined in config.json.
 *
 * Required Supabase tables (create via Supabase dashboard or migration):
 *
 *   sage_invoices  (id text primary key, data jsonb, synced_at timestamptz)
 *   sage_payments  (id text primary key, data jsonb, synced_at timestamptz)
 *   sage_contracts (id text primary key, data jsonb, synced_at timestamptz)
 */
export async function startSync(adapter: SageAdapter): Promise<void> {
  logger.info("Starting SAGE → Supabase sync");

  const supabase = createClient(
    config.sync.supabaseUrl,
    config.sync.supabaseServiceKey
  );

  const now = new Date().toISOString();

  // Sync invoices
  try {
    const invoices = await adapter.listInvoices({ pageSize: 200 });
    const rows = invoices.map((inv) => ({
      id: inv.id,
      data: inv,
      synced_at: now,
    }));
    const { error } = await supabase
      .from("sage_invoices")
      .upsert(rows, { onConflict: "id" });
    if (error) throw error;
    logger.info("Synced invoices", { count: invoices.length });
  } catch (err) {
    logger.error("Invoice sync failed", { err });
  }

  // Sync payments
  try {
    const payments = await adapter.listPayments({ pageSize: 200 });
    const rows = payments.map((p) => ({
      id: p.id,
      data: p,
      synced_at: now,
    }));
    const { error } = await supabase
      .from("sage_payments")
      .upsert(rows, { onConflict: "id" });
    if (error) throw error;
    logger.info("Synced payments", { count: payments.length });
  } catch (err) {
    logger.error("Payment sync failed", { err });
  }

  // Sync contracts
  try {
    const contracts = await adapter.listContracts({ pageSize: 200 });
    const rows = contracts.map((c) => ({
      id: c.id,
      data: c,
      synced_at: now,
    }));
    const { error } = await supabase
      .from("sage_contracts")
      .upsert(rows, { onConflict: "id" });
    if (error) throw error;
    logger.info("Synced contracts", { count: contracts.length });
  } catch (err) {
    logger.error("Contract sync failed", { err });
  }

  logger.info("SAGE → Supabase sync complete");
}
