import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission, type Role } from "@/lib/permissions";
import { eoiSchema } from "@/lib/validation";
import { generateEOINumber, generateReservationNumber } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const eois = await prisma.eOI.findMany({
      include: {
        buyer: {
          select: { id: true, firstName: true, lastName: true, companyName: true, accountNumber: true, mobile: true },
        },
        project: { select: { id: true, name: true, code: true } },
        unit: { select: { id: true, unitNumber: true, finalPrice: true, status: true } },
        verifiedBy: { select: { firstName: true, lastName: true } },
        reservation: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ eois });
  } catch (error) {
    console.error("Fetch EOIs error:", error);
    return NextResponse.json({ error: "Failed to fetch EOIs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!hasPermission(user.role as Role, "eoi.create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = eoiSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation error", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check unit availability
    const unit = await prisma.unit.findUnique({
      where: { id: data.unitId },
    });

    if (!unit) return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    if (unit.status === "SOLD") {
      return NextResponse.json(
        { error: `Cannot create EOI. Unit ${unit.unitNumber} is already SOLD.` },
        { status: 409 }
      );
    }

    const isAdvanceVerified = body.paymentStatus === "VERIFIED" || body.verifiedAdvance === true;
    const paymentStatus = isAdvanceVerified ? "VERIFIED" : (body.paymentStatus || "PENDING");
    const eoiStatus = isAdvanceVerified ? "RESERVATION_ACTIVE" : "PAYMENT_PENDING_VERIFICATION";

    // Create EOI
    const eoi = await prisma.eOI.create({
      data: {
        eoiNumber: generateEOINumber(),
        buyerId: data.buyerId,
        opportunityId: data.opportunityId || null,
        projectId: data.projectId,
        unitId: data.unitId,
        unitPrice: data.unitPrice,
        tokenAmount: data.tokenAmount,
        isRefundable: data.isRefundable ?? false,
        paymentMethod: data.paymentMethod || "BANK_TRANSFER",
        paymentReference: data.paymentReference || null,
        paymentStatus,
        status: eoiStatus,
        verifiedById: isAdvanceVerified ? user.id : null,
        verifiedAt: isAdvanceVerified ? new Date() : null,
        preferredPaymentPlan: data.preferredPaymentPlan || null,
        notes: data.notes || null,
        createdById: user.id,
      },
      include: {
        buyer: true,
        unit: true,
        project: true,
      },
    });

    // If advance is verified, mark unit as RESERVED and update Opportunity stage
    if (isAdvanceVerified) {
      await prisma.unit.update({
        where: { id: data.unitId },
        data: { status: "RESERVED" },
      });

      if (data.opportunityId) {
        await prisma.opportunity.update({
          where: { id: data.opportunityId },
          data: { stage: "NEGOTIATION" },
        });
      }
    }

    await prisma.activity.create({
      data: {
        type: "EOI_EVENT",
        subject: `EOI ${eoi.eoiNumber} Submitted`,
        description: `EOI submitted for Unit ${eoi.unit.unitNumber} with token AED ${eoi.tokenAmount}. Awaiting finance verification.`,
        buyerId: data.buyerId,
        eoiId: eoi.id,
        unitId: data.unitId,
        projectId: data.projectId,
        createdById: user.id,
      },
    });

    return NextResponse.json({ eoi }, { status: 201 });
  } catch (error) {
    console.error("Create EOI error:", error);
    return NextResponse.json({ error: "Failed to submit EOI" }, { status: 500 });
  }
}

