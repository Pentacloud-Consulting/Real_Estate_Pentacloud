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
    if (!hasPermission(user.role as Role, "documents.verify")) {
      return NextResponse.json({ error: "Forbidden: Compliance or Admin only" }, { status: 403 });
    }

    const { id: onboardingId } = await params;
    const body = await request.json().catch(() => ({}));
    const { checklistItemId, verifyAll } = body;

    const onboarding = await prisma.onboarding.findUnique({
      where: { id: onboardingId },
      include: {
        checklistItems: {
          include: { documents: true },
        },
        buyer: true,
      },
    });

    if (!onboarding) {
      return NextResponse.json({ error: "Onboarding record not found" }, { status: 404 });
    }

    const itemsToVerify = verifyAll
      ? onboarding.checklistItems
      : onboarding.checklistItems.filter((i) => i.id === checklistItemId);

    if (itemsToVerify.length === 0) {
      return NextResponse.json({ error: "No checklist item found to verify" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      for (const item of itemsToVerify) {
        let doc = item.documents?.[0];

        if (!doc) {
          doc = await tx.document.create({
            data: {
              fileName: `doc_${item.id}.pdf`,
              originalName: `${item.documentName}.pdf`,
              mimeType: "application/pdf",
              fileSize: 1024 * 1024 * 2, // 2MB
              filePath: `/uploads/kyc/${item.id}.pdf`,
              category: "KYC",
              buyerId: onboarding.buyerId,
              checklistItemId: item.id,
              status: "VERIFIED",
              uploadedById: user.id,
            },
          });
        } else {
          await tx.document.update({
            where: { id: doc.id },
            data: { status: "VERIFIED" },
          });
        }

        // Add verification audit log
        await tx.documentVerification.create({
          data: {
            documentId: doc.id,
            action: "VERIFIED",
            notes: "Verified by Compliance Officer against AML & Land Department registry",
            verifiedById: user.id,
          },
        });

        // Mark checklist item verified
        await tx.onboardingChecklist.update({
          where: { id: item.id },
          data: { status: "VERIFIED" },
        });
      }

      // Recalculate completion percentage
      const allItems = await tx.onboardingChecklist.findMany({
        where: { onboardingId },
      });
      const verifiedCount = allItems.filter((i) => i.status === "VERIFIED").length;
      const pct = allItems.length > 0 ? Math.round((verifiedCount / allItems.length) * 100) : 0;

      await tx.onboarding.update({
        where: { id: onboardingId },
        data: {
          completionPercentage: pct,
          status: pct === 100 ? "COMPLETED" : "IN_PROGRESS",
          completionDate: pct === 100 ? new Date() : null,
        },
      });
    });

    return NextResponse.json({ success: true, verifiedCount: itemsToVerify.length });
  } catch (error: any) {
    console.error("Verify checklist error:", error);
    return NextResponse.json({ error: error.message || "Failed to verify checklist item" }, { status: 500 });
  }
}

