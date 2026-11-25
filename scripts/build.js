const { execSync } = require("child_process");

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

console.log("[build] Database URL resolved:", dbUrl ? "PostgreSQL URL configured" : "No database URL found");

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
  } catch (err) {
    console.warn("[build] Notice during db push/seed:", err.message);
  }
}

// 4. Run Next.js build
console.log("[build] Building Next.js application...");
execSync("next build", { stdio: "inherit", env: process.env });
