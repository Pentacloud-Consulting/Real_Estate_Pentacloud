import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log("Cleaning all transactional & dummy CRM data...");

  // Delete transactional data in correct dependency order
  await prisma.documentVerification.deleteMany();
  await prisma.document.deleteMany();
  await prisma.onboardingChecklist.deleteMany();
  await prisma.onboarding.deleteMany();
  await prisma.paymentMilestone.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.eOI.deleteMany();
  await prisma.opportunityStageHistory.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.buyerAccount.deleteMany();

  // Reset ALL inventory units to AVAILABLE status
  await prisma.unit.updateMany({
    data: {
      status: "AVAILABLE",
    },
  });

  console.log("✓ Cleared all leads, buyers, opportunities, EOIs, reservations, quotations, purchase orders, onboarding checklists, documents, follow-ups, and activities.");
  console.log("✓ Reset 100% of inventory units to 'AVAILABLE'.");
  console.log("✓ Preserved projects, towers, inventory matrix, and user accounts for client demo.");
}

cleanDatabase()
  .catch((e) => {
    console.error("Clean error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

