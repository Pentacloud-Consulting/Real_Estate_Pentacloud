import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { activitySchema } from "@/lib/validation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const activity = await prisma.activity.create({
      data: {
        type: body.type || "NOTE",
        subject: body.subject,
        description: body.description || null,
        leadId: id,
        createdById: user.id,
      },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    console.error("Create lead activity error:", error);
    return NextResponse.json({ error: "Failed to record activity" }, { status: 500 });
  }
}

