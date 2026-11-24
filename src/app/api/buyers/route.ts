import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission, type Role } from "@/lib/permissions";
import { buyerAccountSchema } from "@/lib/validation";
import { generateAccountNumber } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";

    const where: any = {};
    if (!hasPermission(user.role as Role, "buyers.view_all")) {
      where.relationshipManagerId = user.id;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { companyName: { contains: search } },
        { email: { contains: search } },
        { mobile: { contains: search } },
        { accountNumber: { contains: search } },
      ];
    }

    if (type) where.buyerType = type;

    const buyers = await prisma.buyerAccount.findMany({
      where,
      include: {
        relationshipManager: {
          select: { id: true, firstName: true, lastName: true },
        },
        opportunities: {
          select: { id: true, name: true, stage: true, estimatedValue: true },
        },
        onboarding: {
          select: { status: true, completionPercentage: true },
        },
        _count: {
          select: { eois: true, purchaseOrders: true, documents: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ buyers });
  } catch (error) {
    console.error("Fetch buyers error:", error);
    return NextResponse.json({ error: "Failed to fetch buyers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!hasPermission(user.role as Role, "buyers.create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = buyerAccountSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation error", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    const buyer = await prisma.buyerAccount.create({
      data: {
        accountNumber: generateAccountNumber(),
        buyerType: data.buyerType,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        email: data.email || null,
        mobile: data.mobile || null,
        whatsapp: data.whatsapp || null,
        nationality: data.nationality || null,
        countryOfResidence: data.countryOfResidence || null,
        preferredLanguage: data.preferredLanguage || "English",
        passportNumber: data.passportNumber || null,
        nationalId: data.nationalId || null,
        addressLine1: data.addressLine1 || null,
        addressLine2: data.addressLine2 || null,
        city: data.city || null,
        country: data.country || null,
        companyName: data.companyName || null,
        tradeLicenseNumber: data.tradeLicenseNumber || null,
        registrationNumber: data.registrationNumber || null,
        taxRegistration: data.taxRegistration || null,
        registeredAddress: data.registeredAddress || null,
        companyContact: data.companyContact || null,
        authorizedSignatory: data.authorizedSignatory || null,
        relationshipManagerId: data.relationshipManagerId || user.id,
        createdById: user.id,
      },
    });

    await prisma.activity.create({
      data: {
        type: "SYSTEM",
        subject: "Buyer Account Created",
        description: `Account #${buyer.accountNumber} created for ${buyer.companyName || `${buyer.firstName} ${buyer.lastName}`}`,
        buyerId: buyer.id,
        createdById: user.id,
      },
    });

    return NextResponse.json({ buyer }, { status: 201 });
  } catch (error) {
    console.error("Create buyer error:", error);
    return NextResponse.json({ error: "Failed to create buyer" }, { status: 500 });
  }
}

