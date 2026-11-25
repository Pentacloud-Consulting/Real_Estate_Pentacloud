const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const dbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_DATABASE_URL ||
  process.env.POSTGRES_DATABASE_URL_POOLED ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL;

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

try {
  execSync("npx prisma generate", { stdio: "inherit", env: process.env });
} catch (e) {
  console.warn("[prepare-prisma] Prisma generate notice:", e.message);
}
