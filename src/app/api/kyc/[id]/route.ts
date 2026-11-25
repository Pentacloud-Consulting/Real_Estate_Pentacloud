import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// Standard 5 KYC Document types definition
export const KYC_DOCUMENT_TYPES = [
  {
    id: "passport",
    title: "Passport Copy / National ID",
    description: "Clear color scan of photo & personal information page (valid for minimum 6 months)",
    required: true,
  },
  {
    id: "residence_visa",
    title: "Emirates ID / Residence Visa / Permit",
    description: "Front & back of Emirates ID (residents) or entry stamp / residency permit",
    required: true,
  },
  {
    id: "proof_of_address",
    title: "Proof of Residential Address",
    description: "Recent utility bill (DEWA / SEWA / gas / water) or Tenancy Contract (Ejari) dated within 3 months",
    required: true,
  },
  {
    id: "bank_statement",
    title: "Source of Funds / Bank Statement",
    description: "Recent 3 to 6 months bank statement showing liquid funds for purchase",
    required: true,
  },
  {
    id: "kyc_declaration",
    title: "Signed KYC Declaration & Customer Due Diligence",
    description: "Signed Pentacloud Real Estate CDD / Anti-Money Laundering declaration form",
    required: false,
  },
];

// GET: Public endpoint for client document upload landing page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        buyer: {
          select: {
            id: true,
            accountNumber: true,
            name: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            mobile: true,
            whatsapp: true,
            nationality: true,
            countryOfResidence: true,
          },
        },
        contact: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        project: {
          select: {
            name: true,
            location: true,
            propertyType: true,
          },
        },
        unit: {
          select: {
            unitNumber: true,
            unitType: true,
            bedrooms: true,
            floor: true,
          },
        },
        assignedAdvisor: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        documents: {
          where: {
            category: "KYC",
          },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            fileName: true,
            originalName: true,
            mimeType: true,
            fileSize: true,
            category: true,
            docType: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found or link expired" }, { status: 404 });
    }

    return NextResponse.json({
      opportunity: {
        id: opportunity.id,
        opportunityNumber: opportunity.opportunityNumber,
        name: opportunity.name,
        amount: opportunity.amount,
        stage: opportunity.stage,
        buyer: opportunity.buyer,
        contact: opportunity.contact,
        project: opportunity.project,
        unit: opportunity.unit,
        advisor: opportunity.assignedAdvisor,
      },
      documents: opportunity.documents.map((d) => ({
        ...d,
        fileUrl: `/api/kyc/files/${d.id}`,
      })),
      documentTypes: KYC_DOCUMENT_TYPES,
    });
  } catch (error) {
    console.error("Public KYC fetch error:", error);
    return NextResponse.json({ error: "Failed to load document request" }, { status: 500 });
  }
}

// POST: Public endpoint for client (or CRM user) to upload KYC document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { docType, fileName, fileData, fileSize, mimeType, notes } = body;

    if (!docType) {
      return NextResponse.json({ error: "Document type is required" }, { status: 400 });
    }
    if (!fileData || !fileName) {
      return NextResponse.json({ error: "File data and file name are required" }, { status: 400 });
    }

    if (fileData.length > 6 * 1024 * 1024) {
      return NextResponse.json({ error: "File is too large. Please upload an image or scan under 4.5 MB." }, { status: 413 });
    }

    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        buyer: true,
      },
    });

    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    const docTypeConfig = KYC_DOCUMENT_TYPES.find((d) => d.id === docType);
    const docTitle = docTypeConfig?.title || docType;

    // Check if a document of this docType already exists for this opportunity
    const existing = await prisma.document.findFirst({
      where: {
        opportunityId: id,
        docType,
      },
    });

    let document;
    if (existing) {
      // Replace existing with updated version
      document = await prisma.document.update({
        where: { id: existing.id },
        data: {
          fileName: `${opportunity.opportunityNumber}_${docType}_${Date.now()}`,
          originalName: fileName,
          mimeType: mimeType || "application/octet-stream",
          fileSize: fileSize || 0,
          filePath: fileData,
          status: "UPLOADED",
          category: "KYC",
          updatedAt: new Date(),
        },
      });
    } else {
      document = await prisma.document.create({
        data: {
          fileName: `${opportunity.opportunityNumber}_${docType}_${Date.now()}`,
          originalName: fileName,
          mimeType: mimeType || "application/octet-stream",
          fileSize: fileSize || 0,
          filePath: fileData,
          category: "KYC",
          docType,
          status: "UPLOADED",
          opportunityId: id,
          buyerId: opportunity.buyerId,
        },
      });
    }

    // Log activity in opportunity timeline
    await prisma.activity.create({
      data: {
        type: "DOCUMENT_EVENT",
        subject: `Client Uploaded KYC Document: ${docTitle}`,
        description: `File "${fileName}" (${Math.round((fileSize || 0) / 1024)} KB) uploaded via Client KYC Portal. Status: Pending Verification.${notes ? ` Note: ${notes}` : ""}`,
        opportunityId: id,
        buyerId: opportunity.buyerId,
        createdById: opportunity.createdById || opportunity.assignedAdvisorId || "system",
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        fileName: document.fileName,
        originalName: document.originalName,
        mimeType: document.mimeType,
        fileSize: document.fileSize,
        category: document.category,
        docType: document.docType,
        status: document.status,
        createdAt: document.createdAt,
        fileUrl: `/api/kyc/files/${document.id}`,
      },
      message: `${docTitle} uploaded successfully`,
    });
  } catch (error) {
    console.error("Upload KYC document error:", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}

// PATCH: Verify or update document status from CRM
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { documentId, status, notes } = body;

    if (!documentId || !status) {
      return NextResponse.json({ error: "Document ID and status are required" }, { status: 400 });
    }

    const document = await prisma.document.update({
      where: { id: documentId },
      data: { status },
    });

    // Record activity
    await prisma.activity.create({
      data: {
        type: "DOCUMENT_EVENT",
        subject: `KYC Document Status Updated: ${status}`,
        description: `Document "${document.originalName}" marked as ${status}.${notes ? ` Notes: ${notes}` : ""}`,
        opportunityId: id,
        createdById: "system",
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error("Update document status error:", error);
    return NextResponse.json({ error: "Failed to update document status" }, { status: 500 });
  }
}

