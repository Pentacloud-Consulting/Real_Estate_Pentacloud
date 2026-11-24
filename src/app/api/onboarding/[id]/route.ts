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
    const onboarding = await prisma.onboarding.findUnique({
      where: { id },
      include: {
        buyer: {
          include: {
            purchaseOrders: {
              include: {
                unit: true,
                project: true,
              },
            },
          },
        },
        checklistItems: {
          include: {
            documents: {
              include: {
                verifications: {
                  include: {
                    verifiedBy: { select: { firstName: true, lastName: true } },
                  },
                },
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!onboarding) return NextResponse.json({ error: "Onboarding record not found" }, { status: 404 });
    return NextResponse.json({ onboarding });
  } catch (error) {
    console.error("Fetch onboarding detail error:", error);
    return NextResponse.json({ error: "Failed to fetch onboarding record" }, { status: 500 });
  }
}

