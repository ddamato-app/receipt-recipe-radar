# Statement of Work
## SAGE 300 POS Integration – Custom Client Portal

---

| | |
|---|---|
| **Prepared by** | d.damato@gmail.com |
| **Prepared for** | \[Client Name\] |
| **Document date** | July 7, 2026 |
| **Version** | 1.0 |
| **Status** | Draft – For Review |

---

## 1. Executive Summary

This Statement of Work (SOW) describes the design, development, and delivery of a custom integration between **SAGE 300 POS** and a web-based client portal. The portal will allow authorized users to securely view and download invoices, check payment status, and verify contract terms — all sourced in real time from the client's existing SAGE 300 installation on their Windows Server.

The integration consists of two components:

1. **A Windows Service** installed on the client's server that bridges SAGE 300 to the outside world via a secure REST API.
2. **A web portal** accessible to authorized users for self-service access to financial documents.

---

## 2. Objectives

| # | Objective |
|---|---|
| 1 | Eliminate manual delivery of invoices, payment confirmations, and contract documents |
| 2 | Give authorized users 24/7 self-service access to their financial records |
| 3 | Maintain a single source of truth — all data flows from SAGE 300, not a separate database |
| 4 | Keep the client's SAGE 300 server secure — no inbound firewall ports required |
| 5 | Deliver a solution installable on the existing Windows Server without additional infrastructure |

---

## 3. Scope of Work

### 3.1 In Scope

#### Phase 1 — Windows Service (SAGE 300 Connector)

A background Windows Service written in Node.js/TypeScript that runs on the client's Windows Server alongside SAGE 300. It:

- Connects to SAGE 300 via the **SAGE 300 Web API** (preferred), direct SQL Server, or ODBC — the connection method is configurable without code changes
- Exposes a secure internal REST API protected by an API key
- Starts automatically at server boot and restarts itself on failure

**Endpoints delivered:**

| Endpoint | Function |
|---|---|
| `GET /invoices` | List AR invoices with date, customer, and status filters |
| `GET /invoices/:id` | Get a single invoice with full line-item detail |
| `GET /invoices/:id/download` | Download invoice as a formatted PDF |
| `GET /payments` | List AR cash receipts / payments |
| `GET /payments/:id` | Get payment detail with applied invoice breakdown |
| `GET /payments/summary/:customer` | Total paid / outstanding summary for a customer |
| `GET /contracts` | List active contracts (OE quotes / contract module) |
| `GET /contracts/:id` | Get contract detail |
| `GET /contracts/:id/verify` | Verify if a contract is currently active and not expired |
| `GET /health` | Service health check (no auth required) |

#### Phase 2 — Web Portal (Client-Facing UI)

A responsive web application accessible via browser. Features:

- **Secure login** — email + password authentication
- **Invoice centre** — searchable, filterable invoice list; one-click PDF download
- **Payments dashboard** — payment history per customer; balance outstanding
- **Contract viewer** — list of active contracts; contract verification badge (valid / expired)
- **Role-based access** — admin users see all accounts; regular users see only their own records
- **Mobile-friendly** — works on desktop and tablet

#### Phase 3 — Deployment & Handover

- Installation scripts (`install.bat` / `uninstall.bat`) for the Windows Service
- Configuration guide for SAGE 300 Web API user setup
- Portal deployment to hosting environment of choice (cloud or on-premise)
- Data sync testing against a live SAGE 300 company database
- 30-day post-launch support period

---

### 3.2 Out of Scope

The following are **not included** in this SOW unless separately agreed in writing:

- Changes to SAGE 300 configuration, licensing, or module upgrades
- Creation or modification of SAGE 300 data (this is a **read-only** integration)
- Integration with third-party payment processors (Stripe, PayPal, etc.)
- Automated invoice emailing or bulk document distribution
- Mobile native apps (iOS / Android)
- Single Sign-On (SSO) / Active Directory integration
- Multi-company SAGE 300 support (single company only)
- Historical data migration

---

## 4. Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Client's Windows Server                 │
│                                                         │
│   ┌──────────────────┐     ┌──────────────────────────┐ │
│   │   SAGE 300 POS   │────▶│  SAGE 300 Web API        │ │
│   │  (existing)      │     │  (installed module)      │ │
│   └──────────────────┘     └────────────┬─────────────┘ │
│                                         │               │
│                            ┌────────────▼─────────────┐ │
│                            │  Windows Service          │ │
│                            │  (SAGE 300 Connector)     │ │
│                            │  Port 4000 – localhost    │ │
│                            └────────────┬─────────────┘ │
└─────────────────────────────────────────┼───────────────┘
                                          │ HTTPS (outbound only)
                             ┌────────────▼─────────────┐
                             │   Supabase               │
                             │   (Auth + Data cache)    │
                             └────────────┬─────────────┘
                                          │
                             ┌────────────▼─────────────┐
                             │   Web Portal              │
                             │   (React, hosted)         │
                             │   Accessible to users     │
                             └──────────────────────────┘
```

**Key security properties:**
- The Windows Service only listens on `localhost` — it is **never exposed to the internet**
- SAGE 300 data is synced outbound to Supabase on a configurable schedule (default: every 15 minutes)
- All portal API calls go through Supabase, not directly to the client's server
- All connections use HTTPS/TLS in transit
- API key + row-level security protect all data access

---

## 5. Deliverables

| # | Deliverable | Format | When |
|---|---|---|---|
| D1 | Windows Service (source + compiled) | Node.js / TypeScript | Phase 1 complete |
| D2 | `install.bat` / `uninstall.bat` scripts | Windows batch | Phase 1 complete |
| D3 | Configuration guide (SAGE 300 Web API setup) | Markdown / PDF | Phase 1 complete |
| D4 | Web portal (full source code) | React / TypeScript | Phase 2 complete |
| D5 | Deployed portal (live environment) | URL | Phase 3 complete |
| D6 | Integration test report | PDF | Phase 3 complete |
| D7 | Admin & user documentation | PDF | Phase 3 complete |
| D8 | 30-day support period | Email / video calls | Post-launch |

All source code will be delivered via a private GitHub repository. The client will have full ownership of the code upon final payment.

---

## 6. Project Timeline

| Phase | Description | Duration | Start |
|---|---|---|---|
| **Kick-off** | Requirements confirmation, SAGE 300 access credentials, environment setup | 3 days | Week 1 |
| **Phase 1** | Windows Service + SAGE 300 connector | 2 weeks | Week 1 |
| **Phase 2** | Web portal (UI, auth, invoice/payment/contract views) | 3 weeks | Week 3 |
| **Phase 3** | Integration testing, deployment, handover | 1 week | Week 6 |
| **Support** | 30-day post-launch support | 30 days | Week 7 |

**Estimated total duration: 6 weeks to go-live + 30 days support**

> Timeline assumes timely provision of SAGE 300 Web API access credentials and a test company database by the client within the first week.

---

## 7. Investment

| Item | Price |
|---|---|
| Phase 1 — Windows Service & SAGE 300 Connector | \$[X,XXX] |
| Phase 2 — Web Portal | \$[X,XXX] |
| Phase 3 — Deployment, Testing & Handover | \$[X,XXX] |
| 30-Day Post-Launch Support | Included |
| **Total (fixed price)** | **\$[XX,XXX]** |

**Payment schedule:**

| Milestone | Amount |
|---|---|
| SOW signed (project kick-off) | 40% |
| Phase 1 delivery (Windows Service working against test SAGE 300) | 30% |
| Phase 3 completion (portal live, handover complete) | 30% |

All prices are in USD. Invoices payable within 14 days of milestone completion.

---

## 8. Assumptions

1. The client's Windows Server already has **SAGE 300 installed and running** with at least the Accounts Receivable (AR) and Order Entry (OE) modules licensed.
2. The client will install the **SAGE 300 Web API module** (free from Sage) on the same server, or has an IT administrator who can do so. Alternatively, SQL Server or ODBC access to the SAGE 300 database can be used.
3. The client will create a **dedicated SAGE 300 user** (e.g. `WEBAPI`) with read access to AR and OE modules. The built-in `ADMIN` account does not have Web API privileges.
4. The Windows Server has **Node.js 20 LTS** installed (or the client permits its installation).
5. The server has **outbound internet access** on HTTPS (port 443) to sync data to the cloud backend.
6. The client will provide access to a **test SAGE 300 company database** (e.g. `SAMLTD`) for development and testing.
7. Hosting costs for the web portal (e.g. Supabase free/pro tier, Vercel or Netlify) are the client's responsibility.

---

## 9. Client Responsibilities

| Responsibility | Owner |
|---|---|
| Provide SAGE 300 Web API credentials or SQL Server access within 5 business days of signing | Client |
| Provide access to a test/staging SAGE 300 environment | Client |
| Designate a single point of contact for questions and approvals | Client |
| Review and approve deliverables within 5 business days of delivery | Client |
| Manage SAGE 300 software licensing and upgrades | Client |
| Arrange any required IT / firewall changes on the server | Client |

---

## 10. Acceptance Criteria

The project will be considered complete when all of the following are verified in the live production environment:

- [ ] The Windows Service installs and starts automatically on the client's server using `install.bat`
- [ ] `GET /health` returns `{ "status": "ok", "sage": "connected" }`
- [ ] Invoices pulled from SAGE 300 appear correctly in the portal with matching amounts and dates
- [ ] Invoice PDF download generates a correctly formatted document
- [ ] Payment history reflects the correct amounts and applied invoice numbers from SAGE 300
- [ ] Contract verification returns the correct valid/expired status
- [ ] A non-admin portal user can only see records belonging to their own customer account
- [ ] An admin portal user can see all customer records
- [ ] The portal is accessible via HTTPS from a standard web browser

---

## 11. Change Management

Any request to add features, change scope, or extend timelines not covered in this SOW will be handled as a **Change Request (CR)**. A CR will include a description of the change, the estimated additional cost, and the impact on timeline. No change will be implemented without written approval from both parties.

---

## 12. Confidentiality

Both parties agree to keep confidential all technical information, credentials, business data, and terms of this agreement. The contractor will not store or transmit any client SAGE 300 data beyond what is necessary to deliver and test the integration.

---

## 13. Approval

By signing below, both parties agree to the terms of this Statement of Work.

| | Contractor | Client |
|---|---|---|
| **Name** | | |
| **Title** | | |
| **Signature** | | |
| **Date** | | |

---

*This document is confidential and intended solely for the named client.*
