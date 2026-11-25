import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission, type Role } from "@/lib/permissions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedAdvisor: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        salesManager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        broker: true,
        project: true,
        unit: {
          include: {
            building: true,
          },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 30,
          include: {
            createdBy: { select: { firstName: true, lastName: true } },
          },
        },
        followUps: {
          orderBy: { dueDate: "asc" },
          include: {
            assignedTo: { select: { firstName: true, lastName: true } },
          },
        },
        convertedBuyer: {
          select: { id: true, accountNumber: true, buyerType: true },
        },
      },
    });

    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    if (!lead.project && lead.interestedProject) {
      const matchedProj = await prisma.project.findFirst({
        where: { name: { contains: lead.interestedProject } },
      });
      if (matchedProj) {
        (lead as any).project = matchedProj;
        (lead as any).projectId = matchedProj.id;
      }
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error("Fetch lead detail error:", error);
    return NextResponse.json({ error: "Failed to fetch lead" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!hasPermission(user.role as Role, "leads.edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const currentLead = await prisma.lead.findUnique({ where: { id } });
    if (!currentLead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    const cleanData: any = { ...body };
    if (body.annualRevenue !== undefined) cleanData.annualRevenue = body.annualRevenue !== "" && body.annualRevenue !== null ? Number(body.annualRevenue) : null;
    if (body.employees !== undefined) cleanData.employees = body.employees !== "" && body.employees !== null ? parseInt(body.employees) : null;
    if (body.budgetMin !== undefined) cleanData.budgetMin = body.budgetMin !== "" && body.budgetMin !== null ? Number(body.budgetMin) : null;
    if (body.budgetMax !== undefined) cleanData.budgetMax = body.budgetMax !== "" && body.budgetMax !== null ? Number(body.budgetMax) : null;
    if (body.nextFollowUpDate !== undefined) cleanData.nextFollowUpDate = body.nextFollowUpDate ? new Date(body.nextFollowUpDate) : null;
    if (body.projectId !== undefined) cleanData.projectId = body.projectId || null;
    if (body.unitId !== undefined) cleanData.unitId = body.unitId || null;
    if (body.interestedProjectId !== undefined) {
      cleanData.projectId = body.interestedProjectId || null;
      delete cleanData.interestedProjectId;
    }
    if (cleanData.projectId) {
      const proj = await prisma.project.findUnique({ where: { id: cleanData.projectId } });
      if (proj) cleanData.interestedProject = proj.name;
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: cleanData,
    });

    // If status changed, log activity
    if (body.status && body.status !== currentLead.status) {
      await prisma.activity.create({
        data: {
          type: "STATUS_CHANGE",
          subject: `Status changed from ${currentLead.status} to ${body.status}`,
          leadId: id,
          previousValue: currentLead.status,
          newValue: body.status,
          createdById: user.id,
        },
      });
    }

    return NextResponse.json({ lead: updatedLead });
  } catch (error) {
    console.error("Update lead error:", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!hasPermission(user.role as Role, "leads.delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.lead.update({
      where: { id },
      data: { isArchived: true, archivedAt: new Date() },
    });

    await prisma.activity.create({
      data: {
        type: "SYSTEM",
        subject: "Lead Archived",
        description: `Lead was soft-deleted by ${user.firstName} ${user.lastName}`,
        leadId: id,
        createdById: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete lead error:", error);
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}

