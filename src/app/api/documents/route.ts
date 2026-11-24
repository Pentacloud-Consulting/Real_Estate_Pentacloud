import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const documents = await prisma.document.findMany({
      include: {
        buyer: { select: { firstName: true, lastName: true, companyName: true, accountNumber: true } },
        checklistItem: { select: { documentName: true } },
        verifications: {
          include: { verifiedBy: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Fetch vault documents error:", error);
    return NextResponse.json({ error: "Failed to fetch document vault" }, { status: 500 });
  }
}

