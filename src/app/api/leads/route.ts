import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission, type Role } from "@/lib/permissions";
import { generateLeadNumber, normalizePhone } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "25");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const rating = searchParams.get("rating") || "";
    const source = searchParams.get("source") || "";
    const view = searchParams.get("view") || "all";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortDir = (searchParams.get("sortDir") || "desc") as "asc" | "desc";

    const where: any = { isArchived: false };

    // Saved List Views
    if (view === "my") {
      where.assignedAdvisorId = user.id;
    } else if (view === "new") {
      where.status = "NEW";
    } else if (view === "working") {
      where.status = "CONTACTED";
    } else if (view === "qualified") {
      where.status = "QUALIFIED";
    } else if (view === "unqualified") {
      where.status = "UNQUALIFIED";
    } else if (view === "converted") {
      where.isConverted = true;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { company: { contains: search } },
        { email: { contains: search } },
        { mobile: { contains: search } },
        { leadNumber: { contains: search } },
        { industry: { contains: search } },
        { interestedProject: { contains: search } },
      ];
    }

    if (status) where.status = status;
    if (rating) where.rating = rating;
    if (source) where.source = source;

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          assignedAdvisor: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          broker: {
            select: { id: true, name: true, tradeLicense: true },
          },
          project: {
            select: { id: true, name: true, code: true },
          },
          convertedBuyer: {
            select: { id: true, name: true, accountNumber: true },
          },
          convertedContact: {
            select: { id: true, firstName: true, lastName: true, contactNumber: true },
          },
        },
        orderBy: { [sortBy]: sortDir },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.lead.count({ where }),
    ]);

    return NextResponse.json({ leads, total, page, pageSize });
  } catch (error) {
    console.error("Fetch leads error:", error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
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

    const normalizedMobile = body.mobile ? normalizePhone(body.mobile) : "0000000000";

    // Duplicate detection by mobile or email
    if (body.mobile || body.email) {
      const existingLead = await prisma.lead.findFirst({
        where: {
          OR: [
            ...(body.mobile ? [{ mobile: normalizedMobile }] : []),
            ...(body.email ? [{ email: body.email.toLowerCase() }] : []),
          ],
          isArchived: false,
        },
      });

      if (existingLead) {
        return NextResponse.json(
          {
            error: "A lead with this phone number or email already exists.",
            existingLead: {
              id: existingLead.id,
              leadNumber: existingLead.leadNumber,
              name: `${existingLead.firstName} ${existingLead.lastName}`,
              mobile: existingLead.mobile,
              email: existingLead.email,
              status: existingLead.status,
            },
          },
          { status: 409 }
        );
      }
    }

    // Target broker if assigned
    const brokerId = body.brokerId || null;

    let interestedProject = body.interestedProject || null;
    if (body.projectId && !interestedProject) {
      const proj = await prisma.project.findUnique({ where: { id: body.projectId } });
      if (proj) interestedProject = proj.name;
    }

    const lead = await prisma.lead.create({
      data: {
        leadNumber: generateLeadNumber(),
        firstName: body.firstName || "",
        lastName: body.lastName,
        salutation: body.salutation || null,
        company: body.company || body.companyName || null,
        title: body.title || null,
        email: body.email ? body.email.toLowerCase() : null,
        mobile: normalizedMobile,
        whatsapp: body.whatsapp || normalizedMobile,
        nationality: body.nationality || null,
        countryOfResidence: body.countryOfResidence || "UAE",
        preferredLanguage: body.preferredLanguage || "English",
        buyerType: body.buyerType || (body.company ? "CORPORATE" : "INDIVIDUAL"),
        rating: body.rating || "WARM",
        industry: body.industry || null,
        annualRevenue: body.annualRevenue ? Number(body.annualRevenue) : null,
        employees: body.employees ? parseInt(body.employees, 10) : null,
        website: body.website || null,
        street: body.street || body.address || null,
        city: body.city || null,
        state: body.state || null,
        country: body.country || "UAE",
        postalCode: body.postalCode || null,
        projectId: body.projectId || null,
        unitId: body.unitId || null,
        interestedProject,
        propertyType: body.propertyType || "APARTMENT",
        bedroomCount: body.bedroomCount || null,
        budgetMin: body.budgetMin ? Number(body.budgetMin) : null,
        budgetMax: body.budgetMax ? Number(body.budgetMax) : null,
        purchasePurpose: body.purchasePurpose || "INVESTMENT",
        expectedTimeline: body.expectedTimeline || "Within 30 Days",
        source: body.source || "WEBSITE",
        campaignName: body.campaignName || null,
        temperature: body.rating === "HOT" ? "HOT" : body.rating === "COLD" ? "COLD" : "WARM",
        status: body.status || "NEW",
        brokerId,
        assignedAdvisorId: body.assignedAdvisorId || user.id,
        nextFollowUpDate: body.nextFollowUpDate ? new Date(body.nextFollowUpDate) : null,
        qualificationNotes: body.qualificationNotes || null,
        createdById: user.id,
      },
      include: {
        assignedAdvisor: {
          select: { id: true, firstName: true, lastName: true },
        },
        broker: true,
      },
    });

    await prisma.activity.create({
      data: {
        type: "SYSTEM",
        subject: `Lead Created: ${lead.firstName} ${lead.lastName} (${lead.company || "Individual"})`,
        leadId: lead.id,
        createdById: user.id,
      },
    });

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    console.error("Create lead error:", error);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}
