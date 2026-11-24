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
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        buyer: true,
        project: true,
        unit: {
          include: { building: true },
        },
        opportunity: true,
        paymentMilestones: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    return NextResponse.json({ quotation });
  } catch (error) {
    console.error("Fetch quotation error:", error);
    return NextResponse.json({ error: "Failed to fetch quotation" }, { status: 500 });
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

    const currentQuote = await prisma.quotation.findUnique({
      where: { id },
      include: { opportunity: true, unit: true },
    });

    if (!currentQuote) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    // Calculate discount & final price if discount is being negotiated
    let discount = body.discount !== undefined ? Number(body.discount) : currentQuote.discount;
    const discountType = body.discountType !== undefined ? body.discountType : currentQuote.discountType || "FIXED";
    const discountValue = body.discountValue !== undefined ? Number(body.discountValue) : currentQuote.discountValue || 0;

    if (body.discountType === "PERCENTAGE" && body.discountValue !== undefined) {
      discount = (currentQuote.basePrice * Number(body.discountValue)) / 100;
    } else if (body.discountType === "FIXED" && body.discountValue !== undefined) {
      discount = Number(body.discountValue);
    }

    const base = currentQuote.basePrice + currentQuote.floorPremium + currentQuote.viewPremium + currentQuote.otherFees;
    const finalPrice = body.finalPrice !== undefined ? Number(body.finalPrice) : Math.max(0, base - discount + currentQuote.tax);

    // If negotiating with a discount, ensure V1 baseline is preserved and this quotation becomes V2
    let targetVersion = currentQuote.version;
    if (body.status === "NEGOTIATION" || (body.discountValue !== undefined && Number(body.discountValue) > 0)) {
      targetVersion = Math.max(2, currentQuote.version || 2);

      // Preserve V1 original proposal if not already existing
      if (currentQuote.opportunityId) {
        const existingV1 = await prisma.quotation.findFirst({
          where: {
            opportunityId: currentQuote.opportunityId,
            version: 1,
          },
        });

        if (!existingV1) {
          const v1Number = `${currentQuote.quotationNumber.replace(/-V\d+$/, "")}-V1`;
          await prisma.quotation.create({
            data: {
              quotationNumber: v1Number,
              version: 1,
              buyerId: currentQuote.buyerId,
              projectId: currentQuote.projectId,
              unitId: currentQuote.unitId,
              opportunityId: currentQuote.opportunityId,
              basePrice: currentQuote.basePrice,
              floorPremium: currentQuote.floorPremium,
              viewPremium: currentQuote.viewPremium,
              otherFees: currentQuote.otherFees,
              discount: 0,
              discountType: "FIXED",
              discountValue: 0,
              paymentPlan: currentQuote.paymentPlan,
              finalPrice: currentQuote.basePrice,
              currency: currentQuote.currency || "AED",
              status: "SUPERSEDED",
              notes: "Initial Commercial Proposal (Pre-Negotiation)",
              createdById: user.id,
            },
          });
        }
      }
    }

    const updated = await prisma.quotation.update({
      where: { id },
      data: {
        version: targetVersion,
        status: body.status !== undefined ? body.status : undefined,
        discountType,
        discountValue,
        discount,
        finalPrice,
        paymentPlan: body.paymentPlan !== undefined ? body.paymentPlan : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
        validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
      },
      include: {
        buyer: true,
        project: true,
        unit: true,
        opportunity: true,
      },
    });

    // Synchronize linked Opportunity if quotation is negotiated, sent, or accepted
    if (currentQuote.opportunityId) {
      const oppUpdateData: any = {};

      if (discount > 0 || body.finalPrice !== undefined) {
        oppUpdateData.amount = finalPrice;
        oppUpdateData.estimatedValue = finalPrice;
      }

      if (body.paymentPlan) {
        oppUpdateData.paymentPlan = body.paymentPlan;
      }

      if (body.status === "SENT") {
        oppUpdateData.stage = "PROPOSAL";
      } else if (body.status === "ACCEPTED") {
        oppUpdateData.stage = "NEGOTIATION";
      }

      if (Object.keys(oppUpdateData).length > 0) {
        await prisma.opportunity.update({
          where: { id: currentQuote.opportunityId },
          data: oppUpdateData,
        });
      }

      // Record activity log
      let activitySubject = `Quotation #${currentQuote.quotationNumber} Updated`;
      let activityDesc = `Quotation status updated to ${body.status || currentQuote.status}. Net offer: AED ${finalPrice.toLocaleString()}.`;

      if (body.discountValue !== undefined && body.discountValue > 0) {
        activitySubject = `Price Negotiation: Discount Applied to Quotation #${currentQuote.quotationNumber}`;
        activityDesc = `Customer requested discount: ${discountType === "PERCENTAGE" ? `${discountValue}%` : `AED ${discountValue.toLocaleString()}`}. Discount amount: AED ${discount.toLocaleString()}. Revised final price: AED ${finalPrice.toLocaleString()}.`;
      } else if (body.status === "SENT") {
        activitySubject = `Quotation #${currentQuote.quotationNumber} Sent to Buyer`;
        activityDesc = `Quotation formally issued to buyer with net proposal of AED ${finalPrice.toLocaleString()}.`;
      } else if (body.status === "ACCEPTED") {
        activitySubject = `Quotation #${currentQuote.quotationNumber} Accepted by Buyer`;
        activityDesc = `Buyer confirmed acceptance of quoted commercial terms for Unit ${currentQuote.unit.unitNumber}. Ready for EOI & Token Advance.`;
      }

      await prisma.activity.create({
        data: {
          type: "QUOTATION_EVENT",
          subject: activitySubject,
          description: activityDesc,
          opportunityId: currentQuote.opportunityId,
          buyerId: currentQuote.buyerId,
          unitId: currentQuote.unitId,
          projectId: currentQuote.projectId,
          createdById: user.id,
        },
      });
    }

    return NextResponse.json({ quotation: updated });
  } catch (error) {
    console.error("Update quotation error:", error);
    return NextResponse.json({ error: "Failed to update quotation" }, { status: 500 });
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
    await prisma.quotation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete quotation error:", error);
    return NextResponse.json({ error: "Failed to delete quotation" }, { status: 500 });
  }
}

