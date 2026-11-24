import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [activities, followUps] = await Promise.all([
      prisma.activity.findMany({
        include: {
          createdBy: { select: { firstName: true, lastName: true } },
          lead: { select: { firstName: true, lastName: true, leadNumber: true } },
          buyer: { select: { firstName: true, lastName: true, companyName: true, accountNumber: true } },
          project: { select: { name: true } },
          unit: { select: { unitNumber: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.followUp.findMany({
        include: {
          lead: { select: { firstName: true, lastName: true } },
          buyer: { select: { firstName: true, lastName: true, companyName: true } },
          assignedTo: { select: { firstName: true, lastName: true } },
        },
        orderBy: { dueDate: "asc" },
      }),
    ]);

    return NextResponse.json({ activities, followUps });
  } catch (error) {
    console.error("Fetch activities error:", error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}

