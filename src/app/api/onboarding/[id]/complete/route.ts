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
    if (!hasPermission(user.role as Role, "onboarding.complete")) {
      return NextResponse.json({ error: "Forbidden: Compliance or Admin only" }, { status: 403 });
    }

    const { id } = await params;
    const onboarding = await prisma.onboarding.findUnique({
      where: { id },
      include: {
        checklistItems: true,
        buyer: true,
      },
    });

    if (!onboarding) return NextResponse.json({ error: "Onboarding record not found" }, { status: 404 });

    // Enforce business rule: ALL required documents must be VERIFIED
    const unverifiedRequired = onboarding.checklistItems.filter(
      (item) => item.isRequired && item.status !== "VERIFIED"
    );

    if (unverifiedRequired.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot complete onboarding. ${unverifiedRequired.length} mandatory document(s) remain unverified: ${unverifiedRequired.map((u) => u.documentName).join(", ")}.`,
        },
        { status: 400 }
      );
    }

    // Complete onboarding
    const completed = await prisma.onboarding.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completionPercentage: 100,
        completionDate: new Date(),
        reviewerId: user.id,
      },
    });

    await prisma.activity.create({
      data: {
        type: "DOCUMENT_EVENT",
        subject: `Buyer Onboarding Approved & Completed`,
        description: `All KYC documents verified for ${onboarding.buyer.companyName || `${onboarding.buyer.firstName} ${onboarding.buyer.lastName}`}. Buyer is certified Ready for Handover / Title Registration.`,
        buyerId: onboarding.buyerId,
        createdById: user.id,
      },
    });

    return NextResponse.json({ onboarding: completed });
  } catch (error: any) {
    console.error("Complete onboarding error:", error);
    return NextResponse.json({ error: error.message || "Failed to complete onboarding" }, { status: 500 });
  }
}

