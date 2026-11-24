import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission, type Role } from "@/lib/permissions";
import { quotationSchema } from "@/lib/validation";
import { generateQuotationNumber } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const quotations = await prisma.quotation.findMany({
      include: {
        buyer: { select: { firstName: true, lastName: true, companyName: true, accountNumber: true } },
        project: { select: { name: true, code: true } },
        unit: { select: { unitNumber: true } },
        paymentMilestones: { orderBy: { sortOrder: "asc" } },
        approvedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ quotations });
  } catch (error) {
    console.error("Fetch quotations error:", error);
    return NextResponse.json({ error: "Failed to fetch quotations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!hasPermission(user.role as Role, "quotations.create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = quotationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation error", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;
    const milestones = body.milestones || [];

    // Milestone percentage validation (must equal 100%)
    if (milestones.length > 0) {
      const totalPct = milestones.reduce((sum: number, m: any) => sum + Number(m.percentage || 0), 0);
      if (Math.abs(totalPct - 100) > 0.01) {
        return NextResponse.json(
          { error: `Payment milestone schedule must total 100% (currently ${totalPct}%).` },
          { status: 400 }
        );
      }
    }

    const quotation = await prisma.$transaction(async (tx) => {
      const q = await tx.quotation.create({
        data: {
          quotationNumber: generateQuotationNumber(),
          version: 1,
          buyerId: data.buyerId,
          projectId: data.projectId,
          unitId: data.unitId,
          opportunityId: data.opportunityId || null,
          eoiId: data.eoiId || null,
          basePrice: data.basePrice,
          floorPremium: data.floorPremium,
          viewPremium: data.viewPremium,
          otherFees: data.otherFees,
          discount: data.discount,
          discountType: (body as any).discountType || "FIXED",
          discountValue: (body as any).discountValue ? Number((body as any).discountValue) : 0,
          paymentPlan: (body as any).paymentPlan || null,
          tax: data.tax,
          finalPrice: data.finalPrice,
          currency: data.currency || "AED",
          validUntil: data.validUntil ? new Date(data.validUntil) : null,
          notes: data.notes || null,
          termsConditions: data.termsConditions || null,
          status: "DRAFT",
          createdById: user.id,
        },
      });

      if (milestones.length > 0) {
        await tx.paymentMilestone.createMany({
          data: milestones.map((m: any, idx: number) => ({
            quotationId: q.id,
            name: m.name,
            percentage: Number(m.percentage),
            amount: (q.finalPrice * Number(m.percentage)) / 100,
            status: "PENDING",
            sortOrder: idx + 1,
          })),
        });
      }

      // If linked to an Opportunity, sync unit, project, payment plan and log activity
      if (data.opportunityId) {
        await tx.opportunity.update({
          where: { id: data.opportunityId },
          data: {
            projectId: data.projectId,
            unitId: data.unitId,
            amount: data.finalPrice,
            estimatedValue: data.finalPrice,
            paymentPlan: (body as any).paymentPlan || undefined,
          },
        });

        await tx.activity.create({
          data: {
            type: "QUOTATION_EVENT",
            subject: `Commercial Quotation #${q.quotationNumber} Generated`,
            description: `Draft quotation created for AED ${data.finalPrice.toLocaleString()} with payment plan ${(body as any).paymentPlan || "Standard"}.`,
            opportunityId: data.opportunityId,
            buyerId: data.buyerId,
            unitId: data.unitId,
            projectId: data.projectId,
            createdById: user.id,
          },
        });
      }

      return q;
    });

    return NextResponse.json({ quotation }, { status: 201 });
  } catch (error) {
    console.error("Create quotation error:", error);
    return NextResponse.json({ error: "Failed to create quotation" }, { status: 500 });
  }
}

