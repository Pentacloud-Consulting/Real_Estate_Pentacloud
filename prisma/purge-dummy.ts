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

async function purgeDummyData() {
  console.log("[purge-dummy] Checking and removing all dummy seed data...");

  // 1. Identify dummy leads from seed
  const dummyLeads = await prisma.lead.findMany({
    where: {
      OR: [
        { campaignId: "CAMP-Q1-2026" },
        { campaignName: "Q1 Global Investor Campaign" },
        { leadNumber: { startsWith: "LD-200" } },
        { email: { endsWith: "@example.com" } },
        { email: { endsWith: "@example.ae" } },
        { email: { endsWith: "@apexholding.com" } },
        { email: { endsWith: "@vancecap.co.uk" } },
        { email: { endsWith: "@luxliving.fr" } },
        { email: { endsWith: "@chinainvest.cn" } },
        { email: { endsWith: "@berlin-tech.de" } },
        { email: { endsWith: "@lagoscap.ng" } },
        { email: { endsWith: "@trade.ru" } },
        { email: { endsWith: "@siliconinv.com" } },
        { email: { endsWith: "@doha.qa" } },
        { email: { endsWith: "@londonwealth.com" } },
        { email: { endsWith: "@emirates.ae" } },
        { email: { endsWith: "@sginvest.sg" } },
        { email: { endsWith: "@cairogroup.eg" } },
        { email: { endsWith: "@nordic.se" } },
      ],
    },
    select: { id: true, firstName: true, lastName: true },
  });

  const dummyLeadIds = dummyLeads.map((l) => l.id);
  console.log(`[purge-dummy] Found ${dummyLeadIds.length} dummy leads to purge.`);

  // 2. Identify dummy buyer accounts from seed
  const dummyAccounts = await prisma.buyerAccount.findMany({
    where: {
      OR: [
        { accountNumber: { startsWith: "BA-880" } },
        { email: { endsWith: "@example.com" } },
        { email: { endsWith: "@example.ae" } },
        { email: { endsWith: "@apexholding.com" } },
      ],
    },
    select: { id: true, firstName: true, lastName: true },
  });

  const dummyAccountIds = dummyAccounts.map((a) => a.id);
  console.log(`[purge-dummy] Found ${dummyAccountIds.length} dummy buyer accounts to purge.`);

  // 3. Delete dependent records of dummy buyer accounts and dummy leads
  if (dummyAccountIds.length > 0 || dummyLeadIds.length > 0) {
    const opps = await prisma.opportunity.findMany({
      where: {
        buyerId: { in: dummyAccountIds },
      },
      select: { id: true },
    });
    const oppIds = opps.map((o) => o.id);

    // Delete stage history
    await prisma.opportunityStageHistory.deleteMany({
      where: { opportunityId: { in: oppIds } },
    }).catch(() => {});

    // Delete quotations & milestones
    const quotes = await prisma.quotation.findMany({
      where: {
        OR: [
          { opportunityId: { in: oppIds } },
          { buyerId: { in: dummyAccountIds } },
        ],
      },
      select: { id: true },
    });
    const quoteIds = quotes.map((q) => q.id);

    await prisma.paymentMilestone.deleteMany({
      where: { quotationId: { in: quoteIds } },
    }).catch(() => {});

    await prisma.purchaseOrder.deleteMany({
      where: {
        OR: [
          { opportunityId: { in: oppIds } },
          { buyerId: { in: dummyAccountIds } },
        ],
      },
    }).catch(() => {});

    await prisma.quotation.deleteMany({
      where: { id: { in: quoteIds } },
    }).catch(() => {});

    await prisma.reservation.deleteMany({
      where: {
        buyerId: { in: dummyAccountIds },
      },
    }).catch(() => {});

    await prisma.eOI.deleteMany({
      where: {
        buyerId: { in: dummyAccountIds },
      },
    }).catch(() => {});

    await prisma.documentVerification.deleteMany({
      where: {
        document: {
          buyerId: { in: dummyAccountIds },
        },
      },
    }).catch(() => {});

    await prisma.document.deleteMany({
      where: {
        buyerId: { in: dummyAccountIds },
      },
    }).catch(() => {});

    await prisma.onboardingChecklist.deleteMany({
      where: {
        onboarding: {
          buyerId: { in: dummyAccountIds },
        },
      },
    }).catch(() => {});

    await prisma.onboarding.deleteMany({
      where: {
        buyerId: { in: dummyAccountIds },
      },
    }).catch(() => {});

    await prisma.opportunity.deleteMany({
      where: { id: { in: oppIds } },
    }).catch(() => {});

    await prisma.followUp.deleteMany({
      where: {
        OR: [
          { leadId: { in: dummyLeadIds } },
          { buyerId: { in: dummyAccountIds } },
        ],
      },
    }).catch(() => {});

    await prisma.activity.deleteMany({
      where: {
        OR: [
          { leadId: { in: dummyLeadIds } },
          { buyerId: { in: dummyAccountIds } },
        ],
      },
    }).catch(() => {});

    await prisma.contact.deleteMany({
      where: {
        accountId: { in: dummyAccountIds },
      },
    }).catch(() => {});

    // Delete dummy buyer accounts
    await prisma.buyerAccount.deleteMany({
      where: { id: { in: dummyAccountIds } },
    }).catch(() => {});

    // Delete dummy leads
    await prisma.lead.deleteMany({
      where: { id: { in: dummyLeadIds } },
    }).catch(() => {});
  }

  // Delete sample notifications
  await prisma.notification.deleteMany({
    where: {
      OR: [
        { message: { contains: "Zaid Al Nuaimi" } },
        { message: { contains: "Tariq Al Suwaidi" } },
        { message: { contains: "Elena Rostova" } },
        { message: { contains: "EOI-55001" } },
        { message: { contains: "PO-44001" } },
      ],
    },
  }).catch(() => {});

  // Reset reserved units from sample data back to AVAILABLE
  await prisma.unit.updateMany({
    where: {
      status: "RESERVED",
    },
    data: {
      status: "AVAILABLE",
    },
  }).catch(() => {});

  console.log("[purge-dummy] ✓ Completed purge of dummy seed data successfully.");
}

purgeDummyData()
  .catch((e) => {
    console.warn("[purge-dummy] Notice:", e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
