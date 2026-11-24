import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { generateAccountNumber } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const industry = searchParams.get("industry") || "";
    const status = searchParams.get("status") || "";
    const buyerType = searchParams.get("buyerType") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "25", 10);

    const where: any = {};
    if (industry) where.industry = industry;
    if (status) where.status = status;
    if (buyerType) where.buyerType = buyerType;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { companyName: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { mobile: { contains: search } },
        { accountNumber: { contains: search } },
        { industry: { contains: search } },
      ];
    }

    const [accounts, total] = await Promise.all([
      prisma.buyerAccount.findMany({
        where,
        include: {
          relationshipManager: {
            select: { id: true, firstName: true, lastName: true },
          },
          _count: {
            select: { contacts: true, opportunities: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.buyerAccount.count({ where }),
    ]);

    return NextResponse.json({ accounts, total, page, pageSize });
  } catch (error) {
    console.error("Fetch accounts error:", error);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const name = body.name || body.companyName || `${body.firstName || ""} ${body.lastName || ""}`.trim();
    if (!name) {
      return NextResponse.json({ error: "Account Name or Company Name is required" }, { status: 400 });
    }

    const accountNumber = generateAccountNumber();

    const account = await prisma.buyerAccount.create({
      data: {
        accountNumber,
        name,
        companyName: body.companyName || name,
        buyerType: body.buyerType || "CORPORATE",
        industry: body.industry || null,
        website: body.website || null,
        email: body.email ? body.email.toLowerCase() : null,
        mobile: body.mobile || body.phone || null,
        annualRevenue: body.annualRevenue ? Number(body.annualRevenue) : null,
        employees: body.employees ? parseInt(body.employees, 10) : null,
        companySize: body.companySize || null,
        ownership: body.ownership || null,
        status: body.status || "ACTIVE",
        rating: body.rating || "WARM",
        description: body.description || null,
        billingStreet: body.billingStreet || body.addressLine1 || null,
        billingCity: body.billingCity || body.city || null,
        billingState: body.billingState || body.state || null,
        billingCountry: body.billingCountry || body.country || "UAE",
        billingPostalCode: body.billingPostalCode || body.postalCode || null,
        addressLine1: body.billingStreet || body.addressLine1 || null,
        city: body.billingCity || body.city || null,
        state: body.billingState || body.state || null,
        country: body.billingCountry || body.country || "UAE",
        relationshipManagerId: body.relationshipManagerId || user.id,
        createdById: user.id,
      },
    });

    await prisma.activity.create({
      data: {
        type: "SYSTEM",
        subject: `Account Created: ${account.name}`,
        buyerId: account.id,
        createdById: user.id,
      },
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    console.error("Create account error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}

