import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const projects = await prisma.project.findMany({
      include: {
        buildings: true,
        _count: {
          select: { units: true, opportunities: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedProjects = projects.map((p) => {
      let images: string[] = [];
      let videoUrl: string | null = null;
      if (p.imageUrl) {
        try {
          const parsed = JSON.parse(p.imageUrl);
          if (parsed && typeof parsed === "object") {
            images = Array.isArray(parsed.images) ? parsed.images : [];
            videoUrl = parsed.videoUrl || null;
          } else if (typeof p.imageUrl === "string") {
            images = [p.imageUrl];
          }
        } catch {
          images = [p.imageUrl];
        }
      }
      return { ...p, images, videoUrl };
    });

    return NextResponse.json({ projects: formattedProjects });
  } catch (error) {
    console.error("Fetch projects error:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: "Project Name is required" }, { status: 400 });
    }

    let code = (body.code || "").trim().toUpperCase();
    if (!code) {
      code = body.name
        .split(/\s+/)
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 4);
      if (code.length < 2) code = "PRJ" + Math.floor(100 + Math.random() * 900);
    }

    // Check code collision
    const existingCode = await prisma.project.findUnique({ where: { code } });
    if (existingCode) {
      code = `${code}-${Math.floor(10 + Math.random() * 90)}`;
    }

    let amenitiesJson = null;
    if (body.amenities) {
      if (Array.isArray(body.amenities)) {
        amenitiesJson = JSON.stringify(body.amenities);
      } else if (typeof body.amenities === "string") {
        const arr = body.amenities.split(",").map((s: string) => s.trim()).filter(Boolean);
        amenitiesJson = JSON.stringify(arr);
      }
    }

    // Store up to 10 images and 1 video
    let mediaJson = null;
    if (body.images !== undefined || body.videoUrl !== undefined) {
      mediaJson = JSON.stringify({
        images: Array.isArray(body.images) ? body.images.slice(0, 10) : [],
        videoUrl: body.videoUrl || null,
      });
    }

    const project = await prisma.project.create({
      data: {
        name: body.name.trim(),
        code,
        developer: body.developer || "Pentacloud Properties",
        description: body.description || null,
        location: body.location || "Dubai",
        city: body.city || "Dubai",
        country: body.country || "UAE",
        status: body.status || "ACTIVE",
        propertyType: body.propertyType || "APARTMENT",
        priceRangeMin: body.priceRangeMin ? Number(body.priceRangeMin) : null,
        priceRangeMax: body.priceRangeMax ? Number(body.priceRangeMax) : null,
        totalUnits: body.totalUnits ? parseInt(body.totalUnits, 10) : 0,
        amenities: amenitiesJson,
        imageUrl: mediaJson,
        buildings: {
          create: {
            name: body.buildingName || "Tower 1",
          },
        },
      },
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
      } catch {}
    }

    return NextResponse.json({ project: { ...project, images, videoUrl } }, { status: 201 });
  } catch (error: any) {
    console.error("Create project error:", error);
    return NextResponse.json({ error: error.message || "Failed to create project" }, { status: 500 });
  }
}
