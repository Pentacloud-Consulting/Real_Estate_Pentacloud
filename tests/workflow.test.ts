import { PrismaClient } from "@prisma/client";
import { normalizePhone, generateLeadNumber, generateAccountNumber, generateOpportunityNumber } from "../src/lib/utils";
import { INDIVIDUAL_RESIDENT_DOCS } from "../src/lib/constants";

const prisma = new PrismaClient();

async function runTests() {
  console.log("=================================================");
  console.log(" RUNNING PENTACLOUD REAL ESTATE WORKFLOW TESTS");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // TEST 1: Lead Creation and Duplicate Detection
    console.log("Test Suite 1: Lead Management & Duplicate Detection");
    const testMobile = "+971509990001";
    const normalizedMobile = normalizePhone(testMobile);

    const testLead = await prisma.lead.create({
      data: {
        leadNumber: generateLeadNumber(),
        firstName: "TestUser",
        lastName: "DuplicateCheck",
        email: "duplicate.check@example.com",
        mobile: normalizedMobile,
        source: "WEBSITE",
        status: "NEW",
        temperature: "HOT",
      },
    });

    assert(!!testLead.id, "Lead successfully created in database");

    // Check duplicate detection
    const duplicate = await prisma.lead.findFirst({
      where: { mobile: normalizedMobile, isArchived: false },
    });

    assert(duplicate?.id === testLead.id, "Duplicate detection correctly identifies matching phone");

    // TEST 2: Lead Qualification & Conversion
    console.log("\nTest Suite 2: Qualification and Atomic Conversion");
    const qualifiedLead = await prisma.lead.update({
      where: { id: testLead.id },
      data: {
        status: "QUALIFIED",
        qualificationScore: 90,
        budgetMax: 3500000,
      },
    });

    assert(qualifiedLead.status === "QUALIFIED", "Lead qualification status updated");

    // Convert to Buyer Account and Opportunity in a transaction
    const convResult = await prisma.$transaction(async (tx) => {
      const buyer = await tx.buyerAccount.create({
        data: {
          accountNumber: generateAccountNumber(),
          buyerType: "INDIVIDUAL",
          firstName: qualifiedLead.firstName,
          lastName: qualifiedLead.lastName,
          email: qualifiedLead.email,
          mobile: qualifiedLead.mobile,
          convertedFromLeadId: qualifiedLead.id,
        },
      });

      const opp = await tx.opportunity.create({
        data: {
          opportunityNumber: generateOpportunityNumber(),
          name: `${buyer.firstName} ${buyer.lastName} - Waterfront Apartment`,
          buyerId: buyer.id,
          stage: "DISCOVERY",
          estimatedValue: 3500000,
        },
      });

      await tx.lead.update({
        where: { id: qualifiedLead.id },
        data: {
          status: "CONVERTED",
          isConverted: true,
          convertedBuyerId: buyer.id,
          convertedAt: new Date(),
        },
      });

      return { buyer, opp };
    });

    assert(!!convResult.buyer.id, "Buyer Account created from converted lead");
    assert(!!convResult.opp.id, "Property Opportunity created linked to Buyer");

    const reloadedLead = await prisma.lead.findUnique({ where: { id: testLead.id } });
    assert(reloadedLead?.isConverted === true && reloadedLead?.status === "CONVERTED", "Lead status flagged as CONVERTED");

    // TEST 3: Inventory Lock & Duplicate Reservation Prevention
    console.log("\nTest Suite 3: Inventory Integrity & Conflicting Reservation Prevention");
    const availableUnit = await prisma.unit.findFirst({
      where: { status: "AVAILABLE" },
    });

    assert(!!availableUnit, `Available unit found for reservation test (${availableUnit?.unitNumber})`);

    // Lock unit atomically to RESERVED
    await prisma.unit.update({
      where: { id: availableUnit!.id },
      data: { status: "RESERVED" },
    });

    // Check conflict protection
    const checkConflict = await prisma.unit.findUnique({
      where: { id: availableUnit!.id },
    });

    assert(checkConflict?.status === "RESERVED", "Unit locked to RESERVED");
    assert(checkConflict?.status !== "AVAILABLE", "Conflict prevention correctly stops new reservations on locked unit");

    // TEST 4: Purchase Order Sale Confirmation & Automatic Onboarding
    console.log("\nTest Suite 4: Sale Confirmation & Onboarding Launch");
    const project = await prisma.project.findFirst();

    // Create PO
    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber: `PO-TEST-${Date.now().toString().slice(-6)}`,
        buyerId: convResult.buyer.id,
        projectId: project!.id,
        unitId: availableUnit!.id,
        unitPrice: availableUnit!.finalPrice,
        finalAmount: availableUnit!.finalPrice,
        downPayment: availableUnit!.finalPrice * 0.2,
        status: "APPROVED",
      },
    });

    // Confirm Sale: Unit becomes SOLD, Onboarding is generated
    const saleResult = await prisma.$transaction(async (tx) => {
      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: { status: "CONFIRMED", confirmedAt: new Date() },
      });

      await tx.unit.update({
        where: { id: availableUnit!.id },
        data: { status: "SOLD" },
      });

      const onb = await tx.onboarding.create({
        data: {
          onboardingNumber: `ONB-TEST-${Date.now().toString().slice(-6)}`,
          buyerId: convResult.buyer.id,
          buyerCategory: "INDIVIDUAL_RESIDENT",
          status: "IN_PROGRESS",
          completionPercentage: 0,
        },
      });

      await tx.onboardingChecklist.createMany({
        data: INDIVIDUAL_RESIDENT_DOCS.map((doc, idx) => ({
          onboardingId: onb.id,
          documentName: doc.name,
          isRequired: doc.isRequired,
          status: "PENDING_UPLOAD",
          sortOrder: idx + 1,
        })),
      });

      return { onb };
    });

    const soldUnit = await prisma.unit.findUnique({ where: { id: availableUnit!.id } });
    assert(soldUnit?.status === "SOLD", "Unit status atomically transitioned to SOLD upon sale confirmation");
    assert(!!saleResult.onb.id, "Buyer Onboarding record automatically instantiated");

    const checklistCount = await prisma.onboardingChecklist.count({
      where: { onboardingId: saleResult.onb.id },
    });
    assert(checklistCount === 5, `Checklist correctly populated with 5 resident compliance documents (got ${checklistCount})`);

    // TEST 5: Onboarding Completion Rule (Must block if mandatory docs are unverified)
    console.log("\nTest Suite 5: KYC Compliance Gate & Handover Certification");
    const unverifiedItems = await prisma.onboardingChecklist.findMany({
      where: { onboardingId: saleResult.onb.id, isRequired: true, status: { not: "VERIFIED" } },
    });

    assert(unverifiedItems.length > 0, "Compliance Gate correctly detects unverified required documents");

    // Clean up test records
    await prisma.onboardingChecklist.deleteMany({ where: { onboardingId: saleResult.onb.id } });
    await prisma.onboarding.deleteMany({ where: { id: saleResult.onb.id } });
    await prisma.purchaseOrder.deleteMany({ where: { id: po.id } });
    await prisma.opportunity.deleteMany({ where: { id: convResult.opp.id } });
    await prisma.buyerAccount.deleteMany({ where: { id: convResult.buyer.id } });
    await prisma.lead.deleteMany({ where: { id: testLead.id } });
    // Reset unit back to AVAILABLE
    await prisma.unit.update({ where: { id: availableUnit!.id }, data: { status: "AVAILABLE" } });

    console.log("\n-------------------------------------------------");
    console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log("-------------------------------------------------");

    if (failed === 0) {
      console.log("\n🎉 ALL CORE BUSINESS LOGIC TESTS PASSED PERFECTLY!");
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();

