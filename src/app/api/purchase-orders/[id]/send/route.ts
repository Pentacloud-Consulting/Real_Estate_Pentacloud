import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { buyer: true, unit: true, project: true },
    });

    if (!po) return NextResponse.json({ error: "Purchase Order not found" }, { status: 404 });

    const updatedPO = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: "SENT",
      },
    });

    await prisma.activity.create({
      data: {
        type: "DOCUMENT_EVENT",
        subject: `Purchase Order ${po.poNumber} Dispatched to Client`,
        description: `Official Property Sale Purchase Agreement dispatched via email/portal to ${po.buyer.companyName || `${po.buyer.firstName} ${po.buyer.lastName}`} for Unit ${po.unit.unitNumber}.`,
        buyerId: po.buyerId,
        createdById: user.id,
      },
    });

    return NextResponse.json({ po: updatedPO });
  } catch (error: any) {
    console.error("Send PO error:", error);
    return NextResponse.json({ error: error.message || "Failed to dispatch Purchase Order" }, { status: 500 });
  }
}

