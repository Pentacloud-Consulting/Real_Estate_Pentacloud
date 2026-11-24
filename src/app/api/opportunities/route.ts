import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission, type Role } from "@/lib/permissions";
import { opportunitySchema } from "@/lib/validation";
import { generateOpportunityNumber } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const stage = searchParams.get("stage") || "";
    const projectId = searchParams.get("projectId") || "";

    const where: any = {};
    if (!hasPermission(user.role as Role, "opportunities.view_all")) {
      where.assignedAdvisorId = user.id;
    }
    if (stage) where.stage = stage;
    if (projectId) where.projectId = projectId;

    const opportunities = await prisma.opportunity.findMany({
      where,
      include: {
        buyer: {
          select: {
            id: true,
            accountNumber: true,
            firstName: true,
            lastName: true,
            companyName: true,
            buyerType: true,
            mobile: true,
          },
        },
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        project: {
          select: { id: true, name: true, code: true },
        },
        unit: {
          select: { id: true, unitNumber: true, finalPrice: true, status: true },
        },
        assignedAdvisor: {
          select: { id: true, firstName: true, lastName: true },
        },
        broker: {
          select: { id: true, name: true, tradeLicense: true, propertySpecialization: true, yearlyClosed: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ opportunities });
  } catch (error) {
    console.error("Fetch opportunities error:", error);
    return NextResponse.json(
      { error: "Failed to fetch opportunities" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!hasPermission(user.role as Role, "opportunities.create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = opportunitySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation error", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    const opportunity = await prisma.opportunity.create({
      data: {
        opportunityNumber: generateOpportunityNumber(),
        name: data.name,
        buyerId: data.buyerId,
        projectId: data.projectId || null,
        unitId: data.unitId || null,
        propertyType: data.propertyType || "APARTMENT",
        estimatedValue: data.estimatedValue || null,
        budget: data.budget || null,
        probability: data.probability ?? 50,
        expectedClosingDate: data.expectedClosingDate
          ? new Date(data.expectedClosingDate)
          : null,
        stage: data.stage || "NEW",
        scheduledVisitDate: (body as any).scheduledVisitDate ? new Date((body as any).scheduledVisitDate) : null,
        paymentMethod: (body as any).paymentMethod || null,
        paymentPlan: (body as any).paymentPlan || null,
        notes: data.notes || null,
        assignedAdvisorId: data.assignedAdvisorId || user.id,
        salesManagerId: data.salesManagerId || null,
        brokerId: (body as any).brokerId || null,
        createdById: user.id,
      },
    });

    await prisma.opportunityStageHistory.create({
      data: {
        opportunityId: opportunity.id,
        fromStage: "NONE",
        toStage: opportunity.stage,
        changedById: user.id,
        notes: "Opportunity initiated",
      },
    });

    return NextResponse.json({ opportunity }, { status: 201 });
  } catch (error) {
    console.error("Create opportunity error:", error);
    return NextResponse.json(
      { error: "Failed to create opportunity" },
      { status: 500 }
    );
  }
}

