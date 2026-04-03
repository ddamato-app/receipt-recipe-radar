/**
 * Windows Service installer / uninstaller.
 *
 * Usage (run as Administrator in PowerShell or CMD):
 *   node dist/install.js --install
 *   node dist/install.js --uninstall
 *
 * Requires: node-windows  (npm install node-windows)
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Service = require("node-windows").Service;
import path from "path";
import { config } from "./config";

const svc = new Service({
  name: config.service.name,
  description: config.service.description,
  script: path.join(__dirname, "index.js"),
  env: [
    {
      name: "CONFIG_PATH",
      value: path.join(process.cwd(), "config.json"),
    },
    {
      name: "NODE_ENV",
      value: "production",
    },
  ],
  // Restart automatically on crash, up to 3 times
  maxRestarts: 3,
  wait: 2,
  grow: 0.5,
});

const args = process.argv.slice(2);

if (args.includes("--install")) {
  svc.on("install", () => {
    console.log(`✓ Service "${config.service.name}" installed successfully`);
    console.log("  Starting service...");
    svc.start();
  });
  svc.on("start", () => {
    console.log(`✓ Service "${config.service.name}" started`);
    console.log(`  API available at http://127.0.0.1:${config.service.port}`);
  });
  svc.on("error", (err: Error) => {
    console.error("✗ Service error:", err.message);
  });

  console.log(`Installing Windows service: ${config.service.displayName}`);
  svc.install();
} else if (args.includes("--uninstall")) {
  svc.on("uninstall", () => {
    console.log(`✓ Service "${config.service.name}" uninstalled`);
  });
  svc.on("error", (err: Error) => {
    console.error("✗ Uninstall error:", err.message);
  });

  console.log(`Uninstalling Windows service: ${config.service.name}`);
  svc.uninstall();
} else {
  console.log("Usage:");
  console.log("  node dist/install.js --install    Install as Windows service");
  console.log("  node dist/install.js --uninstall  Remove Windows service");
}
