import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get("leadId");
    const buyerId = searchParams.get("buyerId");
    const opportunityId = searchParams.get("opportunityId");
    const status = searchParams.get("status");

    const where: any = {};
    if (leadId) where.leadId = leadId;
    if (buyerId) where.buyerId = buyerId;
    if (opportunityId) where.opportunityId = opportunityId;
    if (status) where.status = status;

    const followUps = await prisma.followUp.findMany({
      where,
      orderBy: { dueDate: "asc" },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return NextResponse.json({ followUps });
  } catch (error) {
    console.error("Fetch follow-ups error:", error);
    return NextResponse.json({ error: "Failed to fetch follow-ups" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { title, description, dueDate, priority, leadId, buyerId, opportunityId, contactId, assignedToId } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }
    if (!dueDate) {
      return NextResponse.json({ error: "Due date and time is required" }, { status: 400 });
    }

    const parsedDueDate = new Date(dueDate);
    if (isNaN(parsedDueDate.getTime())) {
      return NextResponse.json({ error: "Invalid due date format" }, { status: 400 });
    }

    const followUp = await prisma.followUp.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        dueDate: parsedDueDate,
        priority: priority || "MEDIUM",
        status: "PENDING",
        leadId: leadId || null,
        buyerId: buyerId || null,
        opportunityId: opportunityId || null,
        contactId: contactId || null,
        assignedToId: assignedToId || user.id,
      },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // If attached to a lead, update the lead's nextFollowUpDate and record activity
    if (leadId) {
      const nextPending = await prisma.followUp.findFirst({
        where: {
          leadId,
          status: "PENDING",
          dueDate: { gte: new Date() },
        },
        orderBy: { dueDate: "asc" },
      });

      await prisma.lead.update({
        where: { id: leadId },
        data: {
          nextFollowUpDate: nextPending?.dueDate || parsedDueDate,
        },
      }).catch(() => {});

      // Record activity in timeline
      await prisma.activity.create({
        data: {
          type: "FOLLOW_UP",
          subject: `Scheduled Task: ${title.trim()}`,
          description: `Due on ${parsedDueDate.toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          })}${description ? ` — ${description.trim()}` : ""}`,
          leadId,
          createdById: user.id,
        },
      }).catch(() => {});
    }

    return NextResponse.json({ followUp }, { status: 201 });
  } catch (error) {
    console.error("Create follow-up task error:", error);
    return NextResponse.json({ error: "Failed to create follow-up task" }, { status: 500 });
  }
}

