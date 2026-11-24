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

    const { id: documentId } = await params;
    const body = await request.json();

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { checklistItem: true },
    });

    if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark document verified
      const updatedDoc = await tx.document.update({
        where: { id: documentId },
        data: { status: "VERIFIED" },
      });

      // 2. Add verification audit log
      await tx.documentVerification.create({
        data: {
          documentId,
          action: "VERIFIED",
          notes: body.notes || "Verified by Compliance Officer against AML registry",
          verifiedById: user.id,
        },
      });

      // 3. Update checklist item status
      if (document.checklistItemId) {
        await tx.onboardingChecklist.update({
          where: { id: document.checklistItemId },
          data: { status: "VERIFIED" },
        });

        // 4. Recalculate onboarding progress
        const checklist = await tx.onboardingChecklist.findMany({
          where: { onboardingId: document.checklistItem!.onboardingId },
        });

        const verifiedCount = checklist.filter((c) => c.status === "VERIFIED").length;
        const total = checklist.length;
        const pct = total > 0 ? Math.round((verifiedCount / total) * 100) : 0;

        await tx.onboarding.update({
          where: { id: document.checklistItem!.onboardingId },
          data: { completionPercentage: pct },
        });
      }

      return updatedDoc;
    });

    return NextResponse.json({ document: result });
  } catch (error) {
    console.error("Document verify error:", error);
    return NextResponse.json({ error: "Failed to verify document" }, { status: 500 });
  }
}

