import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const SEED_BROKERS = [
  {
    brokerNumber: "BRK-10097",
    name: "Betterhomes Real Estate",
    tradeLicense: "ORN-97",
    contactPerson: "Sarah Jenkins",
    email: "partners@betterhomes.com",
    phone: "+971 4 409 0900",
    propertySpecialization: "Waterfront Apartments & Penthouses",
    monthlyClosed: 6,
    quarterlyClosed: 18,
    yearlyClosed: 52,
    tier: "PLATINUM",
    status: "ACTIVE",
    address: "Marina Plaza, Floor 19, Dubai Marina, Dubai",
    notes: "Top channel partner specializing in high-end coastal developments.",
  },
  {
    brokerNumber: "BRK-10736",
    name: "D&B Properties",
    tradeLicense: "ORN-736",
    contactPerson: "Hussein Kabbani",
    email: "sales@dandbdubai.com",
    phone: "+971 4 871 9200",
    propertySpecialization: "Off-Plan Apartments & Luxury Mansions",
    monthlyClosed: 5,
    quarterlyClosed: 14,
    yearlyClosed: 39,
    tier: "GOLD",
    status: "ACTIVE",
    address: "Blue Bay Tower, Floor 13, Business Bay, Dubai",
    notes: "High volume luxury investor client showcases.",
  },
  {
    brokerNumber: "BRK-11858",
    name: "Fam Properties",
    tradeLicense: "ORN-1858",
    contactPerson: "Firas Al Msaddi",
    email: "vip@famproperties.com",
    phone: "+971 4 369 1700",
    propertySpecialization: "Luxury Villas & Beachfront Residences",
    monthlyClosed: 8,
    quarterlyClosed: 22,
    yearlyClosed: 64,
    tier: "PLATINUM",
    status: "ACTIVE",
    address: "Building 13, Bay Square, Business Bay, Dubai",
    notes: "Strong GCC and international high-net-worth investor network.",
  },
  {
    brokerNumber: "BRK-11815",
    name: "Allsopp & Allsopp",
    tradeLicense: "ORN-1815",
    contactPerson: "Lewis Allsopp",
    email: "corporate@allsoppandallsopp.com",
    phone: "+971 4 429 4444",
    propertySpecialization: "Prime Waterfront Townhouses & Apartments",
    monthlyClosed: 4,
    quarterlyClosed: 12,
    yearlyClosed: 34,
    tier: "GOLD",
    status: "ACTIVE",
    address: "Vision Tower, Floor 26, Business Bay, Dubai",
    notes: "Specialized in sea-view residential units and prime developments.",
  },
  {
    brokerNumber: "BRK-10088",
    name: "Waseem",
    tradeLicense: "ORN-7860",
    contactPerson: "Waseem",
    email: "waseem@brokerage.com",
    phone: "+971 50 123 4567",
    propertySpecialization: "Waterfront Villas & Luxury Apartments",
    monthlyClosed: 9,
    quarterlyClosed: 26,
    yearlyClosed: 78,
    tier: "PLATINUM",
    status: "ACTIVE",
    address: "Downtown Dubai, UAE",
    notes: "Top performing broker partner specializing in high-value property closures.",
  },
];

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";

    // Refresh seed if database has 0 brokers
    const count = await prisma.broker.count();
    if (count === 0) {
      for (const b of SEED_BROKERS) {
        await prisma.broker.create({ data: b });
      }
    }

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { tradeLicense: { contains: search } },
        { contactPerson: { contains: search } },
        { brokerNumber: { contains: search } },
        { propertySpecialization: { contains: search } },
      ];
    }

    const brokers = await prisma.broker.findMany({
      where,
      include: {
        _count: {
          select: { leads: true, buyers: true, opportunities: true },
        },
      },
      orderBy: { yearlyClosed: "desc" },
    });

    return NextResponse.json({ brokers });
  } catch (error: any) {
    console.error("Fetch brokers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch brokers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: "Broker name is required" }, { status: 400 });
    }

    const brokerNumber = `BRK-${Math.floor(10000 + Math.random() * 90000)}`;

    const broker = await prisma.broker.create({
      data: {
        brokerNumber,
        name: body.name,
        tradeLicense: body.tradeLicense || null,
        contactPerson: body.contactPerson || null,
        email: body.email || null,
        phone: body.phone || null,
        propertySpecialization: body.propertySpecialization || "Apartments & Villas",
        monthlyClosed: Number(body.monthlyClosed) || 0,
        quarterlyClosed: Number(body.quarterlyClosed) || 0,
        yearlyClosed: Number(body.yearlyClosed) || 0,
        tier: body.tier || "GOLD",
        status: body.status || "ACTIVE",
        address: body.address || null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ broker }, { status: 201 });
  } catch (error: any) {
    console.error("Create broker error:", error);
    return NextResponse.json(
      { error: "Failed to create broker" },
      { status: 500 }
    );
  }
}
