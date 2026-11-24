# PentaCloud Real Estate Operating Platform

Enterprise-grade Real Estate Sales, Lead Management, Property Inventory Matrix, Expression of Interest (EOI), Purchase Order, and Client KYC Onboarding Platform built with Next.js (App Router), TypeScript, Prisma ORM, Tailwind CSS, and SQLite/PostgreSQL.

---

## 1. Executive Overview & Product Vision

PentaCloud Real Estate Operating Platform orchestrates the entire property lifecycle:
$$\text{Lead} \longrightarrow \text{Qualification} \longrightarrow \text{Buyer Account} \longrightarrow \text{Opportunity} \longrightarrow \text{EOI} \longrightarrow \text{Unit Reservation} \longrightarrow \text{Quotation} \longrightarrow \text{Purchase Order} \longrightarrow \text{KYC Onboarding} \longrightarrow \text{Handover}$$

Designed specifically for real estate developers, property sales advisories, investment funds, finance controllers, and compliance teams.

---

## 2. Technology Architecture

- **Framework**: Next.js 16 (App Router) with React 19 & TypeScript
- **Styling & UI**: Tailwind CSS (with custom Enterprise Navy theme `#153B66` / `#102C4C`), Lucide React icons
- **Data Layer**: Prisma ORM with SQLite for instant local development and direct migration path to PostgreSQL for production
- **Security & RBAC**: JWT session authentication in HTTP-only cookies, password hashing with bcrypt, server-side permission gating
- **Validation**: Schema-level request and form validation with Zod
- **Analytics & Data Tables**: Recharts interactive charting, custom data tables with server-side pagination, multi-filtering, sorting, and CSV exports

---

## 3. Demo Credentials & User Roles

| Role | Email | Password | Access & Responsibilities |
|---|---|---|---|
| **Super Admin** | `admin@pentacloud.com` | `admin123` | Full administrative control, system settings, governance |
| **Admin / Operations** | `ops@pentacloud.com` | `admin123` | Project inventory, unit releases, operational approval |
| **Sales Manager** | `manager@pentacloud.com` | `admin123` | Pipeline tracking, lead assignment, quotation approvals |
| **Sales Advisor 1** | `advisor1@pentacloud.com` | `admin123` | Assigned lead handling, qualification, EOI submission |
| **Sales Advisor 2** | `advisor2@pentacloud.com` | `admin123` | Assigned lead handling, site visits, client follow-ups |
| **Finance Controller** | `finance@pentacloud.com` | `admin123` | EOI token verification, down payment reconciliation |
| **Compliance Officer** | `compliance@pentacloud.com` | `admin123` | KYC document vault review, AML checks, handover certification |

---

## 4. Core Modules & Capabilities

### Module 1: Executive Sales Dashboard (`/dashboard`)
- Dynamic KPI metrics computed directly from database records (Total Leads, Qualified Leads, Active Pipeline, Total Sales Value, Units Reserved/Sold, Onboarding Rate)
- Lead Acquisition Channel breakdown (Website, Instagram, Google, Facebook, LinkedIn, WhatsApp, Walk-in, Broker)
- Real-time Property Inventory Status chart
- Recent transaction activities stream & scheduled follow-ups queue

### Module 2: Lead Management (`/leads`, `/leads/[id]`)
- Global searching, sorting, multi-filtering by source, temperature (Hot, Warm, Cold), and status
- Dual view: Responsive Data Table view and Kanban Pipeline view
- Automated duplicate detection by phone number and email with informative conflict warning
- Full Lead 360 profile with direct communication action buttons (Call, WhatsApp, Email, Schedule Follow-up, Log Site Tour)
- Qualification scoring and one-click atomic conversion into Buyer Account & Opportunity

### Module 3: Buyer Accounts 360 (`/buyers`, `/buyers/[id]`)
- Comprehensive support for **Individual Local Residents**, **Individual International Non-Residents**, and **Corporate / Institutional Entities**
- Buyer 360 profile linking all active Opportunities, EOIs, Reservations, Quotations, Purchase Orders, and KYC documents
- Relationship manager assignment and audit history

### Module 4: Opportunity Pipeline (`/opportunities`)
- Full stage progression: `New` $\rightarrow$ `Discovery` $\rightarrow$ `Shortlisted` $\rightarrow$ `Site Visit` $\rightarrow$ `Negotiation` $\rightarrow$ `EOI` $\rightarrow$ `Reserved` $\rightarrow$ `Purchase Order` $\rightarrow$ `Closed Won`
- Interactive Kanban board with stage transition modals, probability weighting, and pipeline total value calculations

### Module 5: Project Catalog (`/projects`, `/projects/[id]`)
- Development master view for luxury communities (e.g. *Azure Marina Residences*, *Palm Vista Mansions*, *Downtown Heights Tower*)
- Building and tower configurations with unit capacities, price ranges, and amenity catalogs

### Module 6: Property Inventory Matrix (`/inventory`)
- Floor-by-floor unit availability grid and searchable data table
- Color-coded availability statuses: `Available`, `Reserved`, `On Hold`, `Sold`, `Blocked`
- Itemized pricing computation breakdown: Base Price, Floor Premium, View Premium, DLD/Administrative Fees, and Final Price
- Transaction-safe inventory locks preventing duplicate reservations

### Module 7: EOI & Unit Reservations (`/eoi`)
- Formal booking form with token amount, payment method (Wire, Cheque, Card), and payment reference
- Dual-step Finance authorization: Token verification automatically places an atomic reservation lock on the unit with a 14-day expiry window

### Module 8: Quotations & Milestone Payment Plans (`/quotations`)
- Itemized pricing proposal generator with floor/view premiums, fee additions, and promotional discounts
- 100% Construction-linked payment milestone schedule validator
- Formal printable/PDF proposal layout formatted for client signature

### Module 9: Purchase Orders & Sale Finalization (`/purchase-orders`)
- Contract purchase order issuance with down payment tracking
- One-click Sale Confirmation action that atomically updates the Unit to `SOLD`, sets the Opportunity to `CLOSED_WON`, and automatically instantiates the Buyer Onboarding workflow

### Module 10: Buyer Onboarding & KYC Compliance (`/onboarding`, `/onboarding/[id]`)
- Dynamic checklist items generated based on buyer category:
  - **Individual Resident**: Emirates ID, Passport, Proof of UAE Address, KYC Source of Funds Form, Down Payment Cheque/Wire
  - **Individual International**: Valid Passport (>6 months validity), Home Country National/Tax ID, Overseas Address Proof, KYC Declaration, MT103 Swift Wire Copy
  - **Corporate**: Trade License, MOA/AOA, Board Resolution, Signatory & UBO Passports, Tax Registration (TRN) & Bank Proof
- Reviewer workspace with individual document **Verify** and **Reject with Mandatory Reason** actions
- Server-side compliance gate: Onboarding completion and Handover Certification are blocked until all mandatory documents are verified

### Module 11: Enterprise Document Vault (`/documents`)
- Centralized, organized file vault categorized by KYC, Payment, EOI, PO, and Contracts
- Verification audit trail showing reviewer name, timestamp, and review status

### Module 12: Multi-Channel Lead Ingestion Webhook (`/api/leads/external`)
- Public REST endpoint for external website forms, Meta Lead Ads, and marketing landing pages
- Automated payload validation, phone normalization, duplicate checking, and advisor auto-assignment

---

## 5. Getting Started & Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Ensure .env exists (sample provided in .env.example)
DATABASE_URL="file:./dev.db"
JWT_SECRET="pentacloud-dev-secret-change-in-production-2024"
```

### 3. Generate Prisma Client & Run Seed
```bash
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) and sign in using any demo account (e.g. `admin@pentacloud.com` / `admin123`).

### 5. Run Verification & Tests
```bash
# Run business logic integration tests
npx tsx tests/workflow.test.ts

# Run production build check
npm run build
```

---

## 6. Production Deployment (PostgreSQL & Object Storage)

To switch from SQLite to PostgreSQL in production:
1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update `DATABASE_URL` in `.env` to your PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/pentacloud?schema=public"
   ```
3. Run `npx prisma db push` or `npx prisma migrate deploy`.
4. Deploy to Vercel, AWS ECS, or Docker container.
