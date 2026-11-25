const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// 1. Resolve PostgreSQL connection URL from Vercel integration variables
const dbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_DATABASE_URL ||
  process.env.POSTGRES_DATABASE_URL_POOLED ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL;

if (dbUrl) {
  process.env.DATABASE_URL = dbUrl;
}

console.log("[build] Database URL resolved:", dbUrl ? (dbUrl.startsWith("file:") ? "SQLite database configured" : "PostgreSQL URL configured") : "No database URL found");

// Adjust schema.prisma datasource provider based on connection target
const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");
if (fs.existsSync(schemaPath)) {
  let schema = fs.readFileSync(schemaPath, "utf8");
  if (dbUrl && !dbUrl.startsWith("file:")) {
    schema = schema.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');
  } else {
    schema = schema.replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"');
  }
  fs.writeFileSync(schemaPath, schema);
}

// 2. Generate Prisma Client
console.log("[build] Generating Prisma Client...");
execSync("npx prisma generate", { stdio: "inherit", env: process.env });

// 3. Push schema to PostgreSQL & seed initial data on first run
if (dbUrl && !dbUrl.startsWith("file:")) {
  console.log("[build] Syncing schema to PostgreSQL database...");
  try {
    execSync("npx prisma db push --accept-data-loss", { stdio: "inherit", env: process.env });
    console.log("[build] Checking database seed status...");
    execSync("npm run db:seed", { stdio: "inherit", env: process.env });
    console.log("[build] Purging legacy dummy CRM data...");
    execSync("npx tsx prisma/purge-dummy.ts", { stdio: "inherit", env: process.env });
  } catch (err) {
    console.warn("[build] Notice during db push/seed/purge:", err.message);
  }
}

// 4. Run Next.js build
console.log("[build] Building Next.js application...");
execSync("next build", { stdio: "inherit", env: process.env });
