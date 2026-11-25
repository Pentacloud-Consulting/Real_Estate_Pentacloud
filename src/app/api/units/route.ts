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

    const formattedUnits = units.map((u) => {
      let images: string[] = [];
      let videoUrl: string | null = null;
      if (u.facing) {
        try {
          const parsed = JSON.parse(u.facing);
          if (parsed && typeof parsed === "object") {
            images = Array.isArray(parsed.images) ? parsed.images : [];
            videoUrl = parsed.videoUrl || null;
          }
        } catch {}
      }
      return { ...u, images, videoUrl };
    });

    return NextResponse.json({ units: formattedUnits });
  } catch (error) {
    console.error("Fetch units error:", error);
    return NextResponse.json({ error: "Failed to fetch inventory units" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    if (!body.unitNumber || !body.projectId) {
      return NextResponse.json({ error: "Unit Number and Project are required" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: body.projectId },
      include: { buildings: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Selected project not found" }, { status: 404 });
    }

    let buildingId = body.buildingId || null;
    if (!buildingId && project.buildings.length > 0) {
      buildingId = project.buildings[0].id;
    } else if (!buildingId) {
      const b = await prisma.building.create({
        data: { name: "Tower 1", projectId: project.id },
      });
      buildingId = b.id;
    }

    const basePrice = body.basePrice ? Number(body.basePrice) : 0;
    const finalPrice = body.finalPrice ? Number(body.finalPrice) : basePrice;

    let mediaJson = null;
    if (body.images !== undefined || body.videoUrl !== undefined) {
      mediaJson = JSON.stringify({
        images: Array.isArray(body.images) ? body.images.slice(0, 10) : [],
        videoUrl: body.videoUrl || null,
      });
    }

    const unit = await prisma.unit.create({
      data: {
        unitNumber: body.unitNumber.trim(),
        projectId: body.projectId,
        buildingId,
        unitType: body.unitType || "APARTMENT",
        floor: body.floor ? parseInt(body.floor, 10) : 1,
        bedrooms: body.bedrooms ? parseInt(body.bedrooms, 10) : 1,
        bathrooms: body.bathrooms ? parseInt(body.bathrooms, 10) : 1,
        area: body.area ? Number(body.area) : null,
        view: body.view || null,
        facing: mediaJson,
        basePrice,
        finalPrice,
        status: body.status || "AVAILABLE",
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
        building: { select: { id: true, name: true } },
      },
    });

    let images: string[] = [];
    let videoUrl: string | null = null;
    if (unit.facing) {
      try {
        const parsed = JSON.parse(unit.facing);
        images = Array.isArray(parsed.images) ? parsed.images : [];
        videoUrl = parsed.videoUrl || null;
      } catch {}
    }

    return NextResponse.json({ unit: { ...unit, images, videoUrl } }, { status: 201 });
  } catch (error: any) {
    console.error("Create unit error:", error);
    return NextResponse.json({ error: error.message || "Failed to create unit" }, { status: 500 });
  }
}

