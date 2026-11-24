import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission, type Role } from "@/lib/permissions";
import { generateAccountNumber, generateOpportunityNumber, generateContactNumber } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!hasPermission(user.role as Role, "leads.convert")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { activities: true, broker: true },
    });

    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    if (lead.isConverted) {
      return NextResponse.json(
        { error: "Lead is already converted into Contact / Account" },
        { status: 400 }
      );
    }

    // Determine target broker
    const selectedBrokerId = body.brokerId || lead.brokerId || null;

    // Resolve project if any
    let project = null;
    if (body.projectId) {
      project = await prisma.project.findUnique({ where: { id: body.projectId } });
    } else if (lead.projectId) {
      project = await prisma.project.findUnique({ where: { id: lead.projectId } });
    } else if (lead.interestedProject) {
      project = await prisma.project.findFirst({
        where: { name: { contains: lead.interestedProject } },
      });
    }

    // Transactional conversion
    const result = await prisma.$transaction(async (tx) => {
      // 1. Account (Create new or link existing)
      let targetAccountId = body.accountId;
      let accountRecord: any = null;

      if (body.accountOption === "existing" && targetAccountId) {
        accountRecord = await tx.buyerAccount.findUnique({ where: { id: targetAccountId } });
      }

      if (!accountRecord) {
        const accountName =
          body.accountName ||
          lead.company ||
          `${lead.firstName} ${lead.lastName}`.trim() ||
          "New Account";

        accountRecord = await tx.buyerAccount.create({
          data: {
            accountNumber: generateAccountNumber(),
            name: accountName,
            companyName: lead.company || accountName,
            buyerType: lead.buyerType || "INDIVIDUAL",
            firstName: lead.firstName,
            lastName: lead.lastName,
            email: lead.email || undefined,
            mobile: lead.mobile,
            whatsapp: lead.whatsapp || undefined,
            nationality: lead.nationality || undefined,
            countryOfResidence: lead.countryOfResidence || "UAE",
            industry: lead.industry || undefined,
            annualRevenue: lead.annualRevenue || undefined,
            employees: lead.employees || undefined,
            website: lead.website || undefined,
            billingStreet: lead.street || undefined,
            billingCity: lead.city || undefined,
            billingState: lead.state || undefined,
            billingCountry: lead.country || undefined,
            billingPostalCode: lead.postalCode || undefined,
            relationshipManagerId: lead.assignedAdvisorId || user.id,
            brokerId: selectedBrokerId,
            convertedFromLeadId: lead.id,
            createdById: user.id,
          },
        });
        targetAccountId = accountRecord.id;
      }

      // 2. Contact (Create new or link existing)
      let targetContactId = body.contactId;
      let contactRecord: any = null;

      if (body.contactOption === "existing" && targetContactId) {
        contactRecord = await tx.contact.findUnique({ where: { id: targetContactId } });
      }

      if (!contactRecord) {
        contactRecord = await tx.contact.create({
          data: {
            contactNumber: generateContactNumber(),
            firstName: lead.firstName,
            lastName: lead.lastName,
            salutation: lead.salutation || undefined,
            title: lead.title || undefined,
            email: lead.email || undefined,
            phone: lead.mobile,
            mobile: lead.mobile,
            whatsapp: lead.whatsapp || undefined,
            leadSource: lead.source,
            mailingStreet: lead.street || undefined,
            mailingCity: lead.city || undefined,
            mailingState: lead.state || undefined,
            mailingCountry: lead.country || undefined,
            mailingPostalCode: lead.postalCode || undefined,
            accountId: targetAccountId,
            ownerId: lead.assignedAdvisorId || user.id,
            createdById: user.id,
          },
        });
        targetContactId = contactRecord.id;
      } else if (!contactRecord.accountId && targetAccountId) {
        // Link existing contact to account if not linked
        contactRecord = await tx.contact.update({
          where: { id: contactRecord.id },
          data: { accountId: targetAccountId },
        });
      }

      // 3. Opportunity (Create new or skip)
      let opportunityRecord: any = null;
      const skipOpportunity = body.opportunityOption === "skip" || body.skipOpportunity === true;

      if (!skipOpportunity) {
        const oppName =
          body.opportunityName ||
          `${accountRecord.name || lead.firstName + ' ' + lead.lastName} - ${project?.name || lead.interestedProject || "Opportunity"}`;

        const oppAmount = body.opportunityAmount
          ? Number(body.opportunityAmount)
          : lead.budgetMax || lead.budgetMin || 2500000;

        const oppCloseDate = body.opportunityCloseDate
          ? new Date(body.opportunityCloseDate)
          : new Date(Date.now() + 30 * 86400000);

        const oppStage = body.opportunityStage || "PROSPECTING";

        opportunityRecord = await tx.opportunity.create({
          data: {
            opportunityNumber: generateOpportunityNumber(),
            name: oppName,
            buyerId: targetAccountId,
            contactId: targetContactId,
            projectId: project ? project.id : null,
            unitId: body.unitId || lead.unitId || null,
            propertyType: body.propertyType || lead.propertyType || "APARTMENT",
            estimatedValue: oppAmount,
            amount: oppAmount,
            budget: lead.budgetMax || oppAmount,
            probability: body.probability ? Number(body.probability) : 60,
            expectedClosingDate: oppCloseDate,
            closeDate: oppCloseDate,
            stage: oppStage,
            description: lead.qualificationNotes || body.description || null,
            notes: body.conversionNotes || null,
            brokerId: selectedBrokerId,
            scheduledVisitDate: body.scheduledVisitDate ? new Date(body.scheduledVisitDate) : null,
            paymentMethod: body.paymentMethod || null,
            paymentPlan: body.paymentPlan || null,
            assignedAdvisorId: lead.assignedAdvisorId || user.id,
            salesManagerId: lead.salesManagerId,
            createdById: user.id,
          },
        });

        await tx.opportunityStageHistory.create({
          data: {
            opportunityId: opportunityRecord.id,
            fromStage: "NONE",
            toStage: oppStage,
            changedById: user.id,
            notes: "Created via Salesforce Lead Conversion",
          },
        });
      }

      // 4. Update Lead record as CONVERTED
      await tx.lead.update({
        where: { id },
        data: {
          status: "CONVERTED",
          isConverted: true,
          brokerId: selectedBrokerId,
          convertedBuyerId: targetAccountId,
          convertedAccountId: targetAccountId,
          convertedContactId: targetContactId,
          convertedOpportunityId: opportunityRecord ? opportunityRecord.id : null,
          convertedAt: new Date(),
        },
      });

      // 5. Activity Logging
      await tx.activity.create({
        data: {
          type: "STATUS_CHANGE",
          subject: "Lead Converted (Salesforce Workflow)",
          description: `Converted into Account [${accountRecord.name}] and Contact [${contactRecord.firstName} ${contactRecord.lastName}].${
            opportunityRecord ? ` Opportunity [${opportunityRecord.name}] created.` : " Opportunity skipped."
          }`,
          leadId: lead.id,
          buyerId: targetAccountId,
          contactId: targetContactId,
          opportunityId: opportunityRecord ? opportunityRecord.id : null,
          createdById: user.id,
        },
      });

      return {
        account: accountRecord,
        contact: contactRecord,
        opportunity: opportunityRecord,
      };
    });

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error: any) {
    console.error("Lead conversion error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to convert lead" },
      { status: 500 }
    );
  }
}
