import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        buyer: true,
        contact: true,
        project: true,
        unit: {
          include: {
            building: true,
          },
        },
        broker: true,
        assignedAdvisor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        salesManager: {
          select: { id: true, firstName: true, lastName: true },
        },
        stageHistory: {
          orderBy: { createdAt: "desc" },
        },
        eois: {
          orderBy: { createdAt: "desc" },
        },
        quotations: {
          orderBy: { createdAt: "desc" },
        },
        purchaseOrders: {
          orderBy: { createdAt: "desc" },
        },
        documents: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            fileName: true,
            originalName: true,
            mimeType: true,
            fileSize: true,
            category: true,
            docType: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            opportunityId: true,
            buyerId: true,
          },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    return NextResponse.json({ opportunity });
  } catch (error) {
    console.error("Fetch opportunity detail error:", error);
    return NextResponse.json({ error: "Failed to fetch opportunity" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const currentOpp = await prisma.opportunity.findUnique({ where: { id } });
    if (!currentOpp) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });

    const val = body.amount !== undefined ? Number(body.amount) : (body.estimatedValue !== undefined ? Number(body.estimatedValue) : undefined);
    const closeDt = body.closeDate ? new Date(body.closeDate) : (body.expectedClosingDate ? new Date(body.expectedClosingDate) : undefined);

    const updated = await prisma.opportunity.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        buyerId: body.buyerId !== undefined ? body.buyerId : undefined,
        contactId: body.contactId !== undefined ? (body.contactId || null) : undefined,
        stage: body.stage !== undefined ? body.stage : undefined,
        probability: body.probability !== undefined ? Number(body.probability) : undefined,
        estimatedValue: val,
        amount: val,
        budget: body.budget !== undefined ? (body.budget ? Number(body.budget) : null) : undefined,
        projectId: body.projectId !== undefined ? (body.projectId || null) : undefined,
        unitId: body.unitId !== undefined ? (body.unitId || null) : undefined,
        brokerId: body.brokerId !== undefined ? (body.brokerId || null) : undefined,
        assignedAdvisorId: body.assignedAdvisorId !== undefined ? (body.assignedAdvisorId || null) : undefined,
        propertyType: body.propertyType !== undefined ? body.propertyType : undefined,
        scheduledVisitDate: body.scheduledVisitDate ? new Date(body.scheduledVisitDate) : (body.scheduledVisitDate === null ? null : undefined),
        paymentMethod: body.paymentMethod !== undefined ? (body.paymentMethod || null) : undefined,
        paymentPlan: body.paymentPlan !== undefined ? (body.paymentPlan || null) : undefined,
        expectedClosingDate: closeDt,
        closeDate: closeDt,
        notes: body.notes !== undefined ? body.notes : (body.description !== undefined ? body.description : undefined),
        description: body.description !== undefined ? body.description : (body.notes !== undefined ? body.notes : undefined),
      },
      include: {
        buyer: true,
        contact: true,
        project: true,
        unit: {
          include: { building: true },
        },
        broker: true,
        assignedAdvisor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (body.stage && body.stage !== currentOpp.stage) {
      await prisma.opportunityStageHistory.create({
        data: {
          opportunityId: id,
          fromStage: currentOpp.stage,
          toStage: body.stage,
          changedById: user.id,
          notes: body.stageNotes || `Stage changed from ${currentOpp.stage} to ${body.stage}`,
        },
      });

      await prisma.activity.create({
        data: {
          type: "STATUS_CHANGE",
          subject: `Opportunity Stage: ${currentOpp.stage} → ${body.stage}`,
          opportunityId: id,
          buyerId: currentOpp.buyerId,
          createdById: user.id,
        },
      });
    }

    return NextResponse.json({ opportunity: updated });
  } catch (error) {
    console.error("Update opportunity error:", error);
    return NextResponse.json(
      { error: "Failed to update opportunity" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const opp = await prisma.opportunity.findUnique({ where: { id } });
    if (!opp) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });

    // Delete stage histories & dependent records or unlink
    await prisma.opportunityStageHistory.deleteMany({ where: { opportunityId: id } });
    await prisma.activity.updateMany({
      where: { opportunityId: id },
      data: { opportunityId: null },
    });
    await prisma.followUp.updateMany({
      where: { opportunityId: id },
      data: { opportunityId: null },
    });
    await prisma.opportunity.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete opportunity error:", error);
    return NextResponse.json({ error: "Failed to delete opportunity" }, { status: 500 });
  }
}

