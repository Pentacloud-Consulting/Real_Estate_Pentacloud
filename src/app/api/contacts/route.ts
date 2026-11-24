import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const accountId = searchParams.get("accountId") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "25", 10);

    const where: any = {};
    if (accountId) where.accountId = accountId;
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { mobile: { contains: search } },
        { phone: { contains: search } },
        { title: { contains: search } },
        { account: { name: { contains: search } } },
      ];
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: {
          account: {
            select: { id: true, name: true, accountNumber: true, industry: true },
          },
          owner: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.contact.count({ where }),
    ]);

    return NextResponse.json({ contacts, total, page, pageSize });
  } catch (error) {
    console.error("Fetch contacts error:", error);
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    if (!body.lastName) {
      return NextResponse.json({ error: "Last Name is required" }, { status: 400 });
    }

    const contactNumber = `CON-${Math.floor(100000 + Math.random() * 900000)}`;

    const contact = await prisma.contact.create({
      data: {
        contactNumber,
        firstName: body.firstName || "",
        lastName: body.lastName,
        salutation: body.salutation || null,
        title: body.title || null,
        department: body.department || null,
        email: body.email ? body.email.toLowerCase() : null,
        phone: body.phone || null,
        mobile: body.mobile || null,
        whatsapp: body.whatsapp || null,
        leadSource: body.leadSource || null,
        description: body.description || null,
        mailingStreet: body.mailingStreet || null,
        mailingCity: body.mailingCity || null,
        mailingState: body.mailingState || null,
        mailingCountry: body.mailingCountry || null,
        mailingPostalCode: body.mailingPostalCode || null,
        accountId: body.accountId || null,
        ownerId: body.ownerId || user.id,
        createdById: user.id,
      },
      include: {
        account: true,
        owner: true,
      },
    });

    await prisma.activity.create({
      data: {
        type: "SYSTEM",
        subject: `Contact Created: ${contact.firstName} ${contact.lastName}`,
        contactId: contact.id,
        buyerId: contact.accountId,
        createdById: user.id,
      },
    });

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    console.error("Create contact error:", error);
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
  }
}

