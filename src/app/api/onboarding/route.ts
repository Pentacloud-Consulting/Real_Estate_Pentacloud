import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const records = await prisma.onboarding.findMany({
      include: {
        buyer: {
          select: {
            id: true,
            accountNumber: true,
            firstName: true,
            lastName: true,
            companyName: true,
            buyerType: true,
            nationality: true,
            countryOfResidence: true,
            mobile: true,
          },
        },
        checklistItems: {
          include: { documents: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error("Fetch onboarding list error:", error);
    return NextResponse.json({ error: "Failed to fetch onboarding records" }, { status: 500 });
  }
}

