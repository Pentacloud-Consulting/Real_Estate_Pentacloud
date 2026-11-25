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
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        project: true,
        building: true,
        reservations: {
          include: {
            buyer: true,
          },
        },
      },
    });

    if (!unit) return NextResponse.json({ error: "Unit not found" }, { status: 404 });

    let images: string[] = [];
    let videoUrl: string | null = null;
    if (unit.facing) {
      try {
        const parsed = JSON.parse(unit.facing);
        images = Array.isArray(parsed.images) ? parsed.images : [];
        videoUrl = parsed.videoUrl || null;
      } catch {}
    }

    return NextResponse.json({ unit: { ...unit, images, videoUrl } });
  } catch (error) {
    console.error("Fetch unit error:", error);
    return NextResponse.json({ error: "Failed to fetch unit" }, { status: 500 });
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

    const existing = await prisma.unit.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Unit not found" }, { status: 404 });

    const updateData: any = {};
    if (body.unitNumber !== undefined) updateData.unitNumber = body.unitNumber.trim();
    if (body.projectId !== undefined) updateData.projectId = body.projectId;
    if (body.buildingId !== undefined) updateData.buildingId = body.buildingId || null;
    if (body.unitType !== undefined) updateData.unitType = body.unitType;
    if (body.floor !== undefined) updateData.floor = body.floor !== "" && body.floor !== null ? parseInt(body.floor, 10) : null;
    if (body.bedrooms !== undefined) updateData.bedrooms = body.bedrooms !== "" && body.bedrooms !== null ? parseInt(body.bedrooms, 10) : null;
    if (body.bathrooms !== undefined) updateData.bathrooms = body.bathrooms !== "" && body.bathrooms !== null ? parseInt(body.bathrooms, 10) : null;
    if (body.area !== undefined) updateData.area = body.area !== "" && body.area !== null ? Number(body.area) : null;
    if (body.view !== undefined) updateData.view = body.view;
    if (body.basePrice !== undefined) updateData.basePrice = body.basePrice ? Number(body.basePrice) : 0;
    if (body.finalPrice !== undefined) updateData.finalPrice = body.finalPrice ? Number(body.finalPrice) : 0;
    if (body.status !== undefined) updateData.status = body.status;

    if (body.images !== undefined || body.videoUrl !== undefined) {
      let existingImages: string[] = [];
      let existingVideo: string | null = null;
      if (existing.facing) {
        try {
          const parsed = JSON.parse(existing.facing);
          existingImages = parsed.images || [];
          existingVideo = parsed.videoUrl || null;
        } catch {}
      }
      updateData.facing = JSON.stringify({
        images: body.images !== undefined ? (Array.isArray(body.images) ? body.images.slice(0, 10) : []) : existingImages,
        videoUrl: body.videoUrl !== undefined ? body.videoUrl : existingVideo,
      });
    }

    const unit = await prisma.unit.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ unit: { ...unit, images, videoUrl } });
  } catch (error: any) {
    console.error("Update unit error:", error);
    return NextResponse.json({ error: error.message || "Failed to update unit" }, { status: 500 });
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

    // Check if unit is tied to active deals, quotations or purchase orders
    const activeDeals = await prisma.opportunity.count({ where: { unitId: id } });
    if (activeDeals > 0) {
      return NextResponse.json(
        { error: `Cannot delete unit with ${activeDeals} linked active deal(s).` },
        { status: 400 }
      );
    }

    const activePOs = await prisma.purchaseOrder.count({ where: { unitId: id } });
    if (activePOs > 0) {
      return NextResponse.json(
        { error: "Cannot delete unit linked to confirmed Purchase Orders." },
        { status: 400 }
      );
    }

    await prisma.unit.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Unit deleted successfully" });
  } catch (error: any) {
    console.error("Delete unit error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete unit" }, { status: 500 });
  }
}

