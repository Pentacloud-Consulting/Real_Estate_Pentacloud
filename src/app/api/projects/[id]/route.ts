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

    let images: string[] = [];
    let videoUrl: string | null = null;
    if (project.imageUrl) {
      try {
        const parsed = JSON.parse(project.imageUrl);
        images = Array.isArray(parsed.images) ? parsed.images : [];
        videoUrl = parsed.videoUrl || null;
      } catch {
        images = [project.imageUrl];
      }
    }

    return NextResponse.json({ project: { ...project, images, videoUrl } });
  } catch (error) {
    console.error("Fetch project detail error:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.code !== undefined) updateData.code = body.code.trim().toUpperCase();
    if (body.developer !== undefined) updateData.developer = body.developer;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.country !== undefined) updateData.country = body.country;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.propertyType !== undefined) updateData.propertyType = body.propertyType;
    if (body.priceRangeMin !== undefined) updateData.priceRangeMin = body.priceRangeMin ? Number(body.priceRangeMin) : null;
    if (body.priceRangeMax !== undefined) updateData.priceRangeMax = body.priceRangeMax ? Number(body.priceRangeMax) : null;
    if (body.totalUnits !== undefined) updateData.totalUnits = body.totalUnits ? parseInt(body.totalUnits, 10) : 0;

    if (body.amenities !== undefined) {
      if (Array.isArray(body.amenities)) {
        updateData.amenities = JSON.stringify(body.amenities);
      } else if (typeof body.amenities === "string") {
        const arr = body.amenities.split(",").map((s: string) => s.trim()).filter(Boolean);
        updateData.amenities = JSON.stringify(arr);
      }
    }

    if (body.images !== undefined || body.videoUrl !== undefined) {
      let existingImages: string[] = [];
      let existingVideo: string | null = null;
      if (existing.imageUrl) {
        try {
          const parsed = JSON.parse(existing.imageUrl);
          existingImages = parsed.images || [];
          existingVideo = parsed.videoUrl || null;
        } catch {}
      }
      updateData.imageUrl = JSON.stringify({
        images: body.images !== undefined ? (Array.isArray(body.images) ? body.images.slice(0, 10) : []) : existingImages,
        videoUrl: body.videoUrl !== undefined ? body.videoUrl : existingVideo,
      });
    }

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        buildings: true,
        _count: { select: { units: true } },
      },
    });

    let images: string[] = [];
    let videoUrl: string | null = null;
    if (project.imageUrl) {
      try {
        const parsed = JSON.parse(project.imageUrl);
        images = Array.isArray(parsed.images) ? parsed.images : [];
        videoUrl = parsed.videoUrl || null;
      } catch {
        images = [project.imageUrl];
      }
    }

    return NextResponse.json({ project: { ...project, images, videoUrl } });
  } catch (error: any) {
    console.error("Update project error:", error);
    return NextResponse.json({ error: error.message || "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // Check if project has active opportunities or purchase orders
    const activeDeals = await prisma.opportunity.count({ where: { projectId: id } });
    if (activeDeals > 0) {
      return NextResponse.json(
        { error: `Cannot delete project with ${activeDeals} linked active deal(s). Reassign or archive deals first.` },
        { status: 400 }
      );
    }

    // Delete related units and buildings
    await prisma.unit.deleteMany({ where: { projectId: id } });
    await prisma.building.deleteMany({ where: { projectId: id } });
    await prisma.project.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Project deleted successfully" });
  } catch (error: any) {
    console.error("Delete project error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete project" }, { status: 500 });
  }
}

