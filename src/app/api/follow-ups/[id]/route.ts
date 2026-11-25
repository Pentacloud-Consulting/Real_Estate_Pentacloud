import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.followUp.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Follow-up task not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.dueDate !== undefined) updateData.dueDate = new Date(body.dueDate);
    if (body.assignedToId !== undefined) updateData.assignedToId = body.assignedToId;

    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === "COMPLETED") {
        updateData.completedAt = new Date();
      } else if (body.status === "PENDING") {
        updateData.completedAt = null;
      }
    }

    const followUp = await prisma.followUp.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // If attached to a lead, re-calculate lead.nextFollowUpDate
    if (existing.leadId) {
      const nextPending = await prisma.followUp.findFirst({
        where: {
          leadId: existing.leadId,
          status: "PENDING",
          dueDate: { gte: new Date() },
        },
        orderBy: { dueDate: "asc" },
      });

      await prisma.lead.update({
        where: { id: existing.leadId },
        data: {
          nextFollowUpDate: nextPending?.dueDate || null,
        },
      }).catch(() => {});

      // Record activity if marked completed
      if (body.status === "COMPLETED" && existing.status !== "COMPLETED") {
        await prisma.activity.create({
          data: {
            type: "FOLLOW_UP",
            subject: `Completed Task: ${followUp.title}`,
            description: `Task marked as done by ${user.firstName} ${user.lastName}`,
            leadId: existing.leadId,
            createdById: user.id,
          },
        }).catch(() => {});
      }
    }

    return NextResponse.json({ followUp });
  } catch (error) {
    console.error("Update follow-up task error:", error);
    return NextResponse.json({ error: "Failed to update follow-up task" }, { status: 500 });
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
    const existing = await prisma.followUp.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Follow-up task not found" }, { status: 404 });
    }

    await prisma.followUp.delete({
      where: { id },
    });

    // If attached to a lead, recalculate nextFollowUpDate
    if (existing.leadId) {
      const nextPending = await prisma.followUp.findFirst({
        where: {
          leadId: existing.leadId,
          status: "PENDING",
          dueDate: { gte: new Date() },
        },
        orderBy: { dueDate: "asc" },
      });

      await prisma.lead.update({
        where: { id: existing.leadId },
        data: {
          nextFollowUpDate: nextPending?.dueDate || null,
        },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete follow-up task error:", error);
    return NextResponse.json({ error: "Failed to delete follow-up task" }, { status: 500 });
  }
}

