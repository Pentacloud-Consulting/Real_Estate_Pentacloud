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
    const buyer = await prisma.buyerAccount.findUnique({
      where: { id },
      include: {
        relationshipManager: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        opportunities: {
          include: {
            project: { select: { id: true, name: true, code: true } },
            unit: { select: { id: true, unitNumber: true, finalPrice: true } },
          },
        },
        eois: {
          include: {
            unit: { select: { unitNumber: true } },
            project: { select: { name: true } },
          },
        },
        reservations: {
          include: {
            unit: { select: { unitNumber: true } },
            project: { select: { name: true } },
          },
        },
        quotations: {
          include: {
            unit: { select: { unitNumber: true } },
            paymentMilestones: true,
          },
        },
        purchaseOrders: {
          include: {
            unit: { select: { unitNumber: true } },
            project: { select: { name: true } },
          },
        },
        onboarding: {
          include: {
            checklistItems: {
              include: { documents: true },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        documents: {
          orderBy: { createdAt: "desc" },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 25,
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
      },
    });

    if (!buyer) return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    return NextResponse.json({ buyer });
  } catch (error) {
    console.error("Fetch buyer detail error:", error);
    return NextResponse.json({ error: "Failed to fetch buyer details" }, { status: 500 });
  }
}

