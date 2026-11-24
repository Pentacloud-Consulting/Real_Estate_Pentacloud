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
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            accountNumber: true,
            industry: true,
            mobile: true,
            website: true,
          },
        },
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        opportunities: {
          orderBy: { createdAt: "desc" },
          include: {
            project: { select: { name: true } },
          },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 25,
          include: {
            createdBy: { select: { firstName: true, lastName: true } },
          },
        },
        followUps: {
          orderBy: { dueDate: "asc" },
        },
      },
    });

    if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    return NextResponse.json({ contact });
  } catch (error) {
    console.error("Fetch contact error:", error);
    return NextResponse.json({ error: "Failed to fetch contact" }, { status: 500 });
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

    const updated = await prisma.contact.update({
      where: { id },
      data: {
        firstName: body.firstName !== undefined ? body.firstName : undefined,
        lastName: body.lastName !== undefined ? body.lastName : undefined,
        salutation: body.salutation !== undefined ? body.salutation : undefined,
        title: body.title !== undefined ? body.title : undefined,
        department: body.department !== undefined ? body.department : undefined,
        email: body.email !== undefined ? (body.email ? body.email.toLowerCase() : null) : undefined,
        phone: body.phone !== undefined ? body.phone : undefined,
        mobile: body.mobile !== undefined ? body.mobile : undefined,
        whatsapp: body.whatsapp !== undefined ? body.whatsapp : undefined,
        leadSource: body.leadSource !== undefined ? body.leadSource : undefined,
        description: body.description !== undefined ? body.description : undefined,
        mailingStreet: body.mailingStreet !== undefined ? body.mailingStreet : undefined,
        mailingCity: body.mailingCity !== undefined ? body.mailingCity : undefined,
        mailingState: body.mailingState !== undefined ? body.mailingState : undefined,
        mailingCountry: body.mailingCountry !== undefined ? body.mailingCountry : undefined,
        mailingPostalCode: body.mailingPostalCode !== undefined ? body.mailingPostalCode : undefined,
        accountId: body.accountId !== undefined ? (body.accountId || null) : undefined,
        ownerId: body.ownerId !== undefined ? body.ownerId : undefined,
      },
      include: {
        account: true,
        owner: true,
      },
    });

    return NextResponse.json({ contact: updated });
  } catch (error) {
    console.error("Update contact error:", error);
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
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
    await prisma.contact.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Contact deleted successfully" });
  } catch (error) {
    console.error("Delete contact error:", error);
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
  }
}
