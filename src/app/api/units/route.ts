import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || "";
    const status = searchParams.get("status") || "";
    const bedrooms = searchParams.get("bedrooms") || "";
    const unitType = searchParams.get("unitType") || "";
    const search = searchParams.get("search") || "";

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (bedrooms) where.bedrooms = parseInt(bedrooms);
    if (unitType) where.unitType = unitType;
    if (search) {
      where.OR = [
        { unitNumber: { contains: search } },
        { view: { contains: search } },
      ];
    }

    const units = await prisma.unit.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, code: true } },
        building: { select: { id: true, name: true } },
        reservations: {
          where: { status: "ACTIVE" },
          take: 1,
          include: {
            buyer: { select: { firstName: true, lastName: true, companyName: true } },
          },
        },
      },
      orderBy: [{ projectId: "asc" }, { floor: "asc" }, { unitNumber: "asc" }],
    });

    return NextResponse.json({ units });
  } catch (error) {
    console.error("Fetch units error:", error);
    return NextResponse.json({ error: "Failed to fetch inventory units" }, { status: 500 });
  }
}

