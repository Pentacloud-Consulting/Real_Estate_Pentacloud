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
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        buildings: {
          include: {
            units: {
              select: {
                id: true,
                unitNumber: true,
                floor: true,
                bedrooms: true,
                area: true,
                finalPrice: true,
                status: true,
                view: true,
              },
            },
          },
        },
        units: {
          take: 100,
          orderBy: [{ floor: "asc" }, { unitNumber: "asc" }],
        },
        opportunities: {
          take: 10,
          include: {
            buyer: { select: { firstName: true, lastName: true, companyName: true } },
          },
        },
      },
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    return NextResponse.json({ project });
  } catch (error) {
    console.error("Fetch project detail error:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

