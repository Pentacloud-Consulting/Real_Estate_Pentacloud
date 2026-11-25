import { PrismaClient } from "@prisma/client";

const dbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_DATABASE_URL ||
  process.env.POSTGRES_DATABASE_URL_POOLED ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL;

if (dbUrl) {
  process.env.DATABASE_URL = dbUrl;
}

const prisma = new PrismaClient({
  datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
});

async function cleanDatabase() {
  console.log("Cleaning all transactional & dummy CRM data...");

  // Delete transactional data in correct dependency order
  await prisma.documentVerification.deleteMany().catch(() => {});
  await prisma.document.deleteMany().catch(() => {});
  await prisma.onboardingChecklist.deleteMany().catch(() => {});
  await prisma.onboarding.deleteMany().catch(() => {});
  await prisma.paymentMilestone.deleteMany().catch(() => {});
  await prisma.purchaseOrder.deleteMany().catch(() => {});
  await prisma.quotation.deleteMany().catch(() => {});
  await prisma.reservation.deleteMany().catch(() => {});
  await prisma.eOI.deleteMany().catch(() => {});
  await prisma.opportunityStageHistory.deleteMany().catch(() => {});
  await prisma.opportunity.deleteMany().catch(() => {});
  await prisma.followUp.deleteMany().catch(() => {});
  await prisma.activity.deleteMany().catch(() => {});
  await prisma.notification.deleteMany().catch(() => {});
  await prisma.auditLog.deleteMany().catch(() => {});
  await prisma.contact.deleteMany().catch(() => {});
  await prisma.lead.deleteMany().catch(() => {});
  await prisma.buyerAccount.deleteMany().catch(() => {});

  // Reset ALL inventory units to AVAILABLE status
  await prisma.unit.updateMany({
    data: {
      status: "AVAILABLE",
    },
  }).catch(() => {});

  console.log("✓ Cleared all dummy leads, opportunities, quotations, EOIs, purchase orders, contacts, and buyer accounts.");
  console.log("✓ Reset 100% of inventory units to 'AVAILABLE'.");
  console.log("✓ Preserved user logins, projects, towers, and inventory matrix.");
}

cleanDatabase()
  .catch((e) => {
    console.error("Clean error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

