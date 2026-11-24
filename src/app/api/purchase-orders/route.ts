import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission, type Role } from "@/lib/permissions";
import { purchaseOrderSchema } from "@/lib/validation";
import { generatePONumber, generateOnboardingNumber } from "@/lib/utils";
import {
  INDIVIDUAL_RESIDENT_DOCS,
  INDIVIDUAL_INTERNATIONAL_DOCS,
  CORPORATE_DOCS,
} from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orders = await prisma.purchaseOrder.findMany({
      include: {
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            accountNumber: true,
            buyerType: true,
            email: true,
            mobile: true,
            nationality: true,
            countryOfResidence: true,
            onboarding: { select: { id: true, status: true, completionPercentage: true } },
          },
        },
        project: { select: { id: true, name: true, code: true, developer: true, location: true } },
        unit: { select: { id: true, unitNumber: true, status: true, unitType: true, bedrooms: true, area: true, basePrice: true, finalPrice: true } },
        approvedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Ensure every buyer in the PO list has an active Onboarding record for KYC verification
    for (const order of orders) {
      if (!order.buyer.onboarding) {
        let buyerCategory = "INDIVIDUAL_RESIDENT";
        let docTemplates = INDIVIDUAL_RESIDENT_DOCS;

        if (order.buyer.buyerType === "CORPORATE") {
          buyerCategory = "CORPORATE";
          docTemplates = CORPORATE_DOCS;
        } else if (order.buyer.nationality !== "UAE" && order.buyer.countryOfResidence !== "UAE") {
          buyerCategory = "INDIVIDUAL_INTERNATIONAL";
          docTemplates = INDIVIDUAL_INTERNATIONAL_DOCS;
        }

        const newOnboarding = await prisma.onboarding.create({
          data: {
            onboardingNumber: generateOnboardingNumber(),
            buyerId: order.buyer.id,
            buyerCategory,
            status: "IN_PROGRESS",
            completionPercentage: 0,
            submissionDate: new Date(),
            notes: `Onboarding initialized for PO #${order.poNumber}`,
          },
        });

        await prisma.onboardingChecklist.createMany({
          data: docTemplates.map((d, index) => ({
            onboardingId: newOnboarding.id,
            documentName: d.name,
            isRequired: d.isRequired,
            status: "PENDING_UPLOAD",
            sortOrder: index + 1,
          })),
        });

        (order.buyer as any).onboarding = {
          id: newOnboarding.id,
          status: newOnboarding.status,
          completionPercentage: 0,
        };
      }
    }

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Fetch purchase orders error:", error);
    return NextResponse.json({ error: "Failed to fetch purchase orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!hasPermission(user.role as Role, "purchase_orders.create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = purchaseOrderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation error", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify unit is not already SOLD
    const unit = await prisma.unit.findUnique({ where: { id: data.unitId } });
    if (!unit) return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    if (unit.status === "SOLD") {
      return NextResponse.json({ error: "Unit is already sold." }, { status: 409 });
    }

    const po = await prisma.$transaction(async (tx) => {
      const createdPO = await tx.purchaseOrder.create({
        data: {
          poNumber: generatePONumber(),
          buyerId: data.buyerId,
          projectId: data.projectId,
          unitId: data.unitId,
          opportunityId: data.opportunityId || null,
          quotationId: data.quotationId || null,
          eoiId: data.eoiId || null,
          unitPrice: data.unitPrice,
          discount: data.discount,
          additionalCharges: data.additionalCharges,
          finalAmount: data.finalAmount,
          downPayment: data.downPayment,
          paymentPlan: data.paymentPlan || "Construction Linked",
          status: "APPROVED",
          approvedById: user.id,
          approvedAt: new Date(),
          notes: data.notes || null,
          createdById: user.id,
        },
      });

      // Ensure buyer has Onboarding record initialized immediately for KYC verification
      const existingOnboarding = await tx.onboarding.findUnique({
        where: { buyerId: data.buyerId },
      });

      if (!existingOnboarding) {
        const buyer = await tx.buyerAccount.findUnique({ where: { id: data.buyerId } });
        let buyerCategory = "INDIVIDUAL_RESIDENT";
        let docTemplates = INDIVIDUAL_RESIDENT_DOCS;

        if (buyer?.buyerType === "CORPORATE") {
          buyerCategory = "CORPORATE";
          docTemplates = CORPORATE_DOCS;
        } else if (buyer?.nationality !== "UAE" && buyer?.countryOfResidence !== "UAE") {
          buyerCategory = "INDIVIDUAL_INTERNATIONAL";
          docTemplates = INDIVIDUAL_INTERNATIONAL_DOCS;
        }

        const newOnboarding = await tx.onboarding.create({
          data: {
            onboardingNumber: generateOnboardingNumber(),
            buyerId: data.buyerId,
            buyerCategory,
            status: "IN_PROGRESS",
            completionPercentage: 0,
            submissionDate: new Date(),
            notes: `Onboarding initialized for PO #${createdPO.poNumber}`,
          },
        });

        await tx.onboardingChecklist.createMany({
          data: docTemplates.map((d, index) => ({
            onboardingId: newOnboarding.id,
            documentName: d.name,
            isRequired: d.isRequired,
            status: "PENDING_UPLOAD",
            sortOrder: index + 1,
          })),
        });
      }

      // 3. Mark unit as SOLD
      await tx.unit.update({
        where: { id: data.unitId },
        data: { status: "SOLD" },
      });

      // 4. Update EOI status if converted
      if (data.eoiId) {
        await tx.eOI.update({
          where: { id: data.eoiId },
          data: { status: "CONVERTED_TO_PO" },
        });
      }

      // 5. Update linked Opportunity to CLOSED_WON
      if (data.opportunityId) {
        await tx.opportunity.update({
          where: { id: data.opportunityId },
          data: {
            stage: "CLOSED_WON",
            probability: 100,
            amount: data.finalAmount,
          },
        });

        await tx.opportunityStageHistory.create({
          data: {
            opportunityId: data.opportunityId,
            fromStage: "NEGOTIATION",
            toStage: "CLOSED_WON",
            changedById: user.id,
            notes: `Deal Closed Won with PO #${createdPO.poNumber}`,
          },
        });

        await tx.activity.create({
          data: {
            type: "STATUS_CHANGE",
            subject: `Opportunity Closed Won via Purchase Order #${createdPO.poNumber}`,
            description: `Commercial contract confirmed for AED ${data.finalAmount.toLocaleString()}. Down payment of AED ${data.downPayment.toLocaleString()} credited.`,
            opportunityId: data.opportunityId,
            buyerId: data.buyerId,
            createdById: user.id,
          },
        });
      }

      return createdPO;
    });

    return NextResponse.json({ po }, { status: 201 });
  } catch (error) {
    console.error("Create PO error:", error);
    return NextResponse.json({ error: "Failed to generate Purchase Order" }, { status: 500 });
  }
}
