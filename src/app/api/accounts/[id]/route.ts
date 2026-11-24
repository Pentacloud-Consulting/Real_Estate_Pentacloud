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
    const account = await prisma.buyerAccount.findUnique({
      where: { id },
      include: {
        relationshipManager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        broker: {
          select: { id: true, name: true, tradeLicense: true },
        },
        contacts: {
          orderBy: { createdAt: "desc" },
          include: {
            owner: { select: { firstName: true, lastName: true } },
          },
        },
        opportunities: {
          orderBy: { createdAt: "desc" },
          include: {
            project: { select: { name: true, code: true } },
            unit: { select: { unitNumber: true, finalPrice: true } },
            contact: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 30,
          include: {
            createdBy: { select: { firstName: true, lastName: true } },
          },
        },
        followUps: {
          orderBy: { dueDate: "asc" },
        },
        eois: {
          orderBy: { createdAt: "desc" },
        },
        quotations: {
          orderBy: { createdAt: "desc" },
        },
        purchaseOrders: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    // Aggregate summary metrics
    const totalContacts = account.contacts.length;
    const totalOpps = account.opportunities.length;
    const openOpps = account.opportunities.filter(
      (o) => o.stage !== "CLOSED_WON" && o.stage !== "CLOSED_LOST"
    ).length;
    const wonOpps = account.opportunities.filter((o) => o.stage === "CLOSED_WON").length;
    const pipelineValue = account.opportunities.reduce(
      (sum, o) => sum + (o.estimatedValue || o.amount || 0),
      0
    );

    return NextResponse.json({
      account,
      metrics: {
        totalContacts,
        totalOpps,
        openOpps,
        wonOpps,
        pipelineValue,
      },
    });
  } catch (error) {
    console.error("Fetch account error:", error);
    return NextResponse.json({ error: "Failed to fetch account" }, { status: 500 });
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

    const updated = await prisma.buyerAccount.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        companyName: body.companyName !== undefined ? body.companyName : undefined,
        buyerType: body.buyerType !== undefined ? body.buyerType : undefined,
        industry: body.industry !== undefined ? body.industry : undefined,
        website: body.website !== undefined ? body.website : undefined,
        email: body.email !== undefined ? (body.email ? body.email.toLowerCase() : null) : undefined,
        mobile: body.mobile !== undefined ? body.mobile : undefined,
        annualRevenue: body.annualRevenue !== undefined ? (body.annualRevenue ? Number(body.annualRevenue) : null) : undefined,
        employees: body.employees !== undefined ? (body.employees ? parseInt(body.employees, 10) : null) : undefined,
        companySize: body.companySize !== undefined ? body.companySize : undefined,
        ownership: body.ownership !== undefined ? body.ownership : undefined,
        status: body.status !== undefined ? body.status : undefined,
        rating: body.rating !== undefined ? body.rating : undefined,
        description: body.description !== undefined ? body.description : undefined,
        billingStreet: body.billingStreet !== undefined ? body.billingStreet : undefined,
        billingCity: body.billingCity !== undefined ? body.billingCity : undefined,
        billingState: body.billingState !== undefined ? body.billingState : undefined,
        billingCountry: body.billingCountry !== undefined ? body.billingCountry : undefined,
        billingPostalCode: body.billingPostalCode !== undefined ? body.billingPostalCode : undefined,
        relationshipManagerId: body.relationshipManagerId !== undefined ? body.relationshipManagerId : undefined,
      },
      include: {
        relationshipManager: true,
      },
    });

    return NextResponse.json({ account: updated });
  } catch (error) {
    console.error("Update account error:", error);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
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
    await prisma.buyerAccount.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}

