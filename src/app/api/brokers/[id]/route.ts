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
    const broker = await prisma.broker.findUnique({
      where: { id },
      include: {
        leads: {
          select: { id: true, leadNumber: true, firstName: true, lastName: true, status: true, interestedProject: true },
        },
        buyers: {
          select: { id: true, accountNumber: true, firstName: true, lastName: true, companyName: true },
        },
        opportunities: {
          select: { id: true, opportunityNumber: true, name: true, stage: true, estimatedValue: true },
        },
      },
    });

    if (!broker) return NextResponse.json({ error: "Broker not found" }, { status: 404 });

    return NextResponse.json({ broker });
  } catch (error: any) {
    console.error("Get broker error:", error);
    return NextResponse.json({ error: "Failed to fetch broker" }, { status: 500 });
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

    const broker = await prisma.broker.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        tradeLicense: body.tradeLicense !== undefined ? body.tradeLicense : undefined,
        contactPerson: body.contactPerson !== undefined ? body.contactPerson : undefined,
        email: body.email !== undefined ? body.email : undefined,
        phone: body.phone !== undefined ? body.phone : undefined,
        propertySpecialization: body.propertySpecialization !== undefined ? body.propertySpecialization : undefined,
        monthlyClosed: body.monthlyClosed !== undefined ? Number(body.monthlyClosed) : undefined,
        quarterlyClosed: body.quarterlyClosed !== undefined ? Number(body.quarterlyClosed) : undefined,
        yearlyClosed: body.yearlyClosed !== undefined ? Number(body.yearlyClosed) : undefined,
        tier: body.tier !== undefined ? body.tier : undefined,
        status: body.status !== undefined ? body.status : undefined,
        address: body.address !== undefined ? body.address : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
      },
    });

    return NextResponse.json({ broker });
  } catch (error: any) {
    console.error("Update broker error:", error);
    return NextResponse.json({ error: "Failed to update broker" }, { status: 500 });
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
    await prisma.broker.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete broker error:", error);
    return NextResponse.json({ error: "Failed to delete broker" }, { status: 500 });
  }
}
