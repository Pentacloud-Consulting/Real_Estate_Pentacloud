import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission, type Role } from "@/lib/permissions";
import { generateOnboardingNumber } from "@/lib/utils";
import {
  INDIVIDUAL_RESIDENT_DOCS,
  INDIVIDUAL_INTERNATIONAL_DOCS,
  CORPORATE_DOCS,
} from "@/lib/constants";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!hasPermission(user.role as Role, "purchase_orders.confirm")) {
      return NextResponse.json(
        { error: "Forbidden: Only authorized officers can confirm sale completion" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { buyer: true, unit: true, project: true },
    });

    if (!po) return NextResponse.json({ error: "Purchase Order not found" }, { status: 404 });
    if (po.status === "CONFIRMED" || po.status === "CLOSED_WON") {
      return NextResponse.json({ error: "Sale already confirmed." }, { status: 400 });
    }

    // Atomic execution of sale confirmation, unit status update, opportunity closure, and onboarding launch
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark PO as Confirmed / Closed Won
      const confirmedPO = await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: "CONFIRMED",
          confirmedAt: new Date(),
        },
      });

      // 2. Update Unit to SOLD
      await tx.unit.update({
        where: { id: po.unitId },
        data: { status: "SOLD" },
      });

      // 3. Mark Opportunity Closed Won
      if (po.opportunityId) {
        await tx.opportunity.update({
          where: { id: po.opportunityId },
          data: {
            stage: "CLOSED_WON",
            probability: 100,
          },
        });
      }

      // 4. Determine Buyer Onboarding Category & generate checklist
      let buyerCategory = "INDIVIDUAL_RESIDENT";
      let docTemplates = INDIVIDUAL_RESIDENT_DOCS;

      if (po.buyer.buyerType === "CORPORATE") {
        buyerCategory = "CORPORATE";
        docTemplates = CORPORATE_DOCS;
      } else if (po.buyer.nationality !== "UAE" && po.buyer.countryOfResidence !== "UAE") {
        buyerCategory = "INDIVIDUAL_INTERNATIONAL";
        docTemplates = INDIVIDUAL_INTERNATIONAL_DOCS;
      }

      // Check if onboarding already exists
      let onboarding = await tx.onboarding.findUnique({
        where: { buyerId: po.buyerId },
      });

      if (!onboarding) {
        const createdOnboarding = await tx.onboarding.create({
          data: {
            onboardingNumber: generateOnboardingNumber(),
            buyerId: po.buyerId,
            buyerCategory,
            status: "IN_PROGRESS",
            completionPercentage: 0,
            submissionDate: new Date(),
            notes: `Onboarding initiated upon confirmation of PO #${po.poNumber} for Unit ${po.unit.unitNumber}`,
          },
        });

        // Seed checklist items
        await tx.onboardingChecklist.createMany({
          data: docTemplates.map((d, index) => ({
            onboardingId: createdOnboarding.id,
            documentName: d.name,
            isRequired: d.isRequired,
            status: "PENDING_UPLOAD",
            sortOrder: index + 1,
          })),
        });

        onboarding = createdOnboarding;
      }

      // 5. Activity logs
      await tx.activity.create({
        data: {
          type: "PAYMENT_EVENT",
          subject: `Sale Confirmed for Unit ${po.unit.unitNumber}`,
          description: `Down payment confirmed. Sale recorded at AED ${po.finalAmount}. Unit marked as SOLD.`,
          buyerId: po.buyerId,
          unitId: po.unitId,
          purchaseOrderId: po.id,
          createdById: user.id,
        },
      });

      return { purchaseOrder: confirmedPO, onboarding };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("PO confirmation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to confirm purchase" },
      { status: 500 }
    );
  }
}
