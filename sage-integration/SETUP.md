# SAGE 300 POS Integration – Setup Guide

A Node.js Windows service that connects to **SAGE 300 POS** and exposes a
REST API for downloading invoices, checking payments, and verifying contracts.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Windows Server 2016+ | Where SAGE 300 is installed |
| Node.js 20 LTS | [nodejs.org](https://nodejs.org) – install system-wide |
| SAGE 300 access | Web API, SQL Server, or ODBC (choose one) |
| Administrator rights | Required for service installation |

---

## Quick Start

### 1. Copy & edit config

```bat
copy config.example.json config.json
notepad config.json
```

Fill in:
- `service.apiKey` – a long random secret (e.g. generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- `sage.adapter` – one of `webapi`, `sqlserver`, or `odbc`
- The matching section for your chosen adapter (see below)

### 2. Install (run as Administrator)

```bat
install.bat
```

This will:
1. Run `npm install`
2. Compile TypeScript → `dist/`
3. Register the Windows service (auto-start on boot)

### 3. Verify

Open `http://localhost:4000/health` in a browser on the server.  
Expected response:
```json
{ "status": "ok", "sage": "connected", "adapter": "webapi" }
```

---

## Adapter Configuration

### Option A – SAGE 300 Web API (Recommended)

Requires the **SAGE 300 Web API** module to be installed alongside SAGE 300.

```json
"sage": {
  "adapter": "webapi",
  "webapi": {
    "baseUrl": "http://localhost/Sage300WebApi/v1.0/-/SAMLTD",
    "username": "WEBAPI",
    "password": "your_sage_password",
    "companyId": "SAMLTD"
  }
}
```

Replace `SAMLTD` with your SAGE company ID.

> **Important:** The SAGE 300 Web API requires a dedicated user account with Web API security group access. The `ADMIN` user does **not** have Web API privileges by default — you must create a separate `WEBAPI` user (or enable Web API on an existing user) in SAGE 300 User Management.

> **Swagger UI:** Once the Web API is installed, you can browse all available endpoints at `http://<server>/Sage300WebApi/` — this shows every module, field name, and lets you test calls interactively.

### Option B – SQL Server Direct

Requires read access to the SAGE 300 SQL Server database.

```json
"sage": {
  "adapter": "sqlserver",
  "sqlserver": {
    "server": "localhost\\SAGE300",
    "database": "SAMLTD",
    "user": "sa",
    "password": "your_sql_password",
    "options": { "encrypt": false, "trustServerCertificate": true }
  }
}
```

### Option C – ODBC

Requires the SAGE 300 ODBC driver. Set up a System DSN in **Windows ODBC
Data Source Administrator** first.

```json
"sage": {
  "adapter": "odbc",
  "odbc": {
    "connectionString": "DSN=SAGE300;Uid=ADMIN;Pwd=your_password;"
  }
}
```

---

## API Reference

All endpoints (except `/health`) require the API key:

```
Authorization: Bearer <your-api-key>
```

### Invoices

| Method | Path | Description |
|---|---|---|
| GET | `/invoices` | List invoices (`?fromDate=2024-01-01&customerCode=CUST01&pageSize=50`) |
| GET | `/invoices/:id` | Get invoice by ID |
| GET | `/invoices/:id/download` | Download invoice as PDF |

### Payments

| Method | Path | Description |
|---|---|---|
| GET | `/payments` | List payments |
| GET | `/payments/:id` | Get payment by ID |
| GET | `/payments/summary/:customerCode` | Payment summary for a customer |

### Contracts

| Method | Path | Description |
|---|---|---|
| GET | `/contracts` | List contracts (`?customerCode=CUST01&status=active`) |
| GET | `/contracts/:id` | Get contract by ID |
| GET | `/contracts/:id/verify` | Verify if contract is valid |

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Service + SAGE connectivity status (no auth) |

---

## Optional: Supabase Sync

To automatically sync SAGE data into Supabase, set:

```json
"sync": {
  "enabled": true,
  "cronSchedule": "*/15 * * * *",
  "supabaseUrl": "https://your-project.supabase.co",
  "supabaseServiceKey": "your-service-role-key"
}
```

Create these tables in Supabase first:

```sql
create table sage_invoices  (id text primary key, data jsonb, synced_at timestamptz);
create table sage_payments  (id text primary key, data jsonb, synced_at timestamptz);
create table sage_contracts (id text primary key, data jsonb, synced_at timestamptz);
```

---

## Logs

Logs are written to `C:\ProgramData\Sage300Integration\logs\` by default.
Change `logging.dir` in `config.json` to override.

---

## Uninstall

```bat
uninstall.bat
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Service won't start | Check `error.log`; verify `config.json` is valid JSON |
| `401 Unauthorized` | Check `Authorization: Bearer <key>` matches `service.apiKey` |
| SAGE Web API 401 | Verify SAGE username/password and that Web API is licensed |
| SQL connection error | Check server name, firewall rules, SQL Browser service |
| ODBC error | Confirm System DSN exists and SAGE ODBC driver is installed |
