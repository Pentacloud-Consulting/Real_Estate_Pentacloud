import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { leadSchema } from "@/lib/validation";
import { generateLeadNumber, normalizePhone } from "@/lib/utils";

// Public external lead submission endpoint for websites and marketing landing pages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = leadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation error", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;
    const normalizedMobile = normalizePhone(data.mobile);

    // Duplicate detection
    const existing = await prisma.lead.findFirst({
      where: {
        OR: [
          { mobile: normalizedMobile },
          ...(data.email ? [{ email: data.email.toLowerCase() }] : []),
        ],
        isArchived: false,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: true,
          message: "Inquiry received. A sales advisor will be in touch shortly.",
          leadNumber: existing.leadNumber,
          isDuplicate: true,
        },
        { status: 200 }
      );
    }

    // Assign to default sales manager or advisor
    const advisor = await prisma.user.findFirst({
      where: { role: "SALES_ADVISOR", isActive: true },
    });

    const lead = await prisma.lead.create({
      data: {
        leadNumber: generateLeadNumber(),
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email ? data.email.toLowerCase() : null,
        mobile: normalizedMobile,
        whatsapp: data.whatsapp || normalizedMobile,
        source: data.source || "WEBSITE",
        campaignName: data.campaignName || "Organic Website Form",
        interestedProject: data.interestedProject || null,
        propertyType: data.propertyType || "APARTMENT",
        budgetMax: data.budgetMax || null,
        status: "NEW",
        temperature: "HOT",
        assignedAdvisorId: advisor ? advisor.id : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Lead received and assigned successfully.",
      leadNumber: lead.leadNumber,
    }, { status: 201 });
  } catch (error) {
    console.error("External lead webhook error:", error);
    return NextResponse.json(
      { error: "Failed to process lead submission" },
      { status: 500 }
    );
  }
}

