import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission, type Role } from "@/lib/permissions";
import { generateReservationNumber } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!hasPermission(user.role as Role, "eoi.verify_payment")) {
      return NextResponse.json(
        { error: "Forbidden: Only Finance or authorized managers can verify token deposits" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const eoi = await prisma.eOI.findUnique({
      where: { id },
      include: { unit: true, buyer: true },
    });

    if (!eoi) return NextResponse.json({ error: "EOI not found" }, { status: 404 });
    if (eoi.paymentStatus === "VERIFIED") {
      return NextResponse.json({ error: "Payment is already verified" }, { status: 400 });
    }

    // Atomic unit lock & reservation activation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Double check unit status in transaction
      const currentUnit = await tx.unit.findUnique({
        where: { id: eoi.unitId },
      });

      if (!currentUnit || (currentUnit.status !== "AVAILABLE" && currentUnit.status !== "ON_HOLD")) {
        throw new Error(
          `Unit ${eoi.unit.unitNumber} is no longer available (Status: ${currentUnit?.status}). Reservation cannot be placed.`
        );
      }

      // 2. Mark EOI payment verified
      const updatedEOI = await tx.eOI.update({
        where: { id },
        data: {
          paymentStatus: "VERIFIED",
          status: "RESERVATION_ACTIVE",
          verifiedById: user.id,
          verifiedAt: new Date(),
        },
      });

      // 3. Create Reservation with 14-day expiry
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 14);

      const reservation = await tx.reservation.create({
        data: {
          reservationNumber: generateReservationNumber(),
          buyerId: eoi.buyerId,
          projectId: eoi.projectId,
          unitId: eoi.unitId,
          eoiId: eoi.id,
          reservationDate: new Date(),
          expiryDate: expiry,
          tokenAmount: eoi.tokenAmount,
          paymentStatus: "CONFIRMED",
          status: "ACTIVE",
          notes: `Reservation activated following token payment verification by ${user.firstName} ${user.lastName}.`,
        },
      });

      // 4. Lock Unit to RESERVED
      await tx.unit.update({
        where: { id: eoi.unitId },
        data: { status: "RESERVED" },
      });

      // 5. Update opportunity stage to RESERVED if attached
      if (eoi.opportunityId) {
        await tx.opportunity.update({
          where: { id: eoi.opportunityId },
          data: { stage: "RESERVED" },
        });
      }

      // 6. Log transaction activities
      await tx.activity.create({
        data: {
          type: "PAYMENT_EVENT",
          subject: "EOI Token Payment Verified",
          description: `Token amount of AED ${eoi.tokenAmount} verified by Finance. Escrow confirmed.`,
          buyerId: eoi.buyerId,
          eoiId: eoi.id,
          unitId: eoi.unitId,
          createdById: user.id,
        },
      });

      await tx.activity.create({
        data: {
          type: "RESERVATION_EVENT",
          subject: `Unit ${eoi.unit.unitNumber} Officially Reserved`,
          description: `Reservation ${reservation.reservationNumber} active until ${expiry.toLocaleDateString()}.`,
          buyerId: eoi.buyerId,
          unitId: eoi.unitId,
          eoiId: eoi.id,
          createdById: user.id,
        },
      });

      return { eoi: updatedEOI, reservation };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Token verification error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify payment and lock unit" },
      { status: 400 }
    );
  }
}

