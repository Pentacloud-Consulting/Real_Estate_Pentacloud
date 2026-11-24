import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission, type Role } from "@/lib/permissions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!hasPermission(user.role as Role, "leads.qualify")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { temperature, qualificationScore, qualificationNotes, interestedProject, propertyType, budgetMax } = body;

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        status: "QUALIFIED",
        temperature: temperature || "HOT",
        qualificationScore: qualificationScore ? parseInt(qualificationScore) : 80,
        qualificationNotes: qualificationNotes || "Prospect qualified via direct sales consultation.",
        interestedProject: interestedProject || undefined,
        propertyType: propertyType || undefined,
        budgetMax: budgetMax ? parseFloat(budgetMax) : undefined,
      },
    });

    await prisma.activity.create({
      data: {
        type: "STATUS_CHANGE",
        subject: "Lead Qualified",
        description: `Lead qualified with score ${lead.qualificationScore}/100 and temperature ${lead.temperature}. Notes: ${lead.qualificationNotes}`,
        leadId: id,
        createdById: user.id,
      },
    });

    return NextResponse.json({ lead });
  } catch (error) {
    console.error("Qualify lead error:", error);
    return NextResponse.json({ error: "Failed to qualify lead" }, { status: 500 });
  }
}

