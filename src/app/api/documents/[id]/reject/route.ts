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
    if (!hasPermission(user.role as Role, "documents.reject")) {
      return NextResponse.json({ error: "Forbidden: Compliance or Admin only" }, { status: 403 });
    }

    const { id: documentId } = await params;
    const body = await request.json();

    if (!body.reason || !body.reason.trim()) {
      return NextResponse.json(
        { error: "A rejection reason is strictly mandatory." },
        { status: 400 }
      );
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { checklistItem: true },
    });

    if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark document rejected
      const updatedDoc = await tx.document.update({
        where: { id: documentId },
        data: { status: "REJECTED" },
      });

      // 2. Add verification audit log
      await tx.documentVerification.create({
        data: {
          documentId,
          action: "REJECTED",
          notes: body.reason,
          verifiedById: user.id,
        },
      });

      // 3. Mark checklist item as RESUBMISSION_REQUIRED
      if (document.checklistItemId) {
        await tx.onboardingChecklist.update({
          where: { id: document.checklistItemId },
          data: { status: "RESUBMISSION_REQUIRED" },
        });
      }

      return updatedDoc;
    });

    return NextResponse.json({ document: result });
  } catch (error) {
    console.error("Document reject error:", error);
    return NextResponse.json({ error: "Failed to reject document" }, { status: 500 });
  }
}

