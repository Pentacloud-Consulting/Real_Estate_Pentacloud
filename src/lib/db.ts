import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getPrismaClient(): PrismaClient {
  let dbUrl = process.env.DATABASE_URL;

  // On Vercel / AWS Lambda / Serverless, handle SQLite database location & permissions
  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT
  );

  if (isServerless && (!dbUrl || dbUrl.startsWith("file:"))) {
    const tmpDbPath = path.join("/tmp", "dev.db");

    if (!fs.existsSync(tmpDbPath)) {
      const searchLocations = [
        path.join(process.cwd(), "prisma", "dev.db"),
        path.join(process.cwd(), "dev.db"),
        path.join(__dirname, "dev.db"),
        path.join(__dirname, "..", "prisma", "dev.db"),
        path.join(__dirname, "..", "..", "prisma", "dev.db"),
        path.join(__dirname, "..", "..", "..", "prisma", "dev.db"),
        path.join("/var/task", "prisma", "dev.db"),
        path.join("/var/task", "dev.db"),
      ];

      for (const src of searchLocations) {
        try {
          if (fs.existsSync(src)) {
            fs.copyFileSync(src, tmpDbPath);
            console.log(`[db.ts] Copied SQLite database from ${src} to ${tmpDbPath}`);
            break;
          }
        } catch (e) {
          console.warn(`[db.ts] Failed to copy from ${src}:`, e);
        }
      }
    }

    if (fs.existsSync(tmpDbPath)) {
      dbUrl = `file:${tmpDbPath}`;
    }
  }

  return new PrismaClient({
    datasources: dbUrl
      ? {
          db: {
            url: dbUrl,
          },
        }
      : undefined,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;

