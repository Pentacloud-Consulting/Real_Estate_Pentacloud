import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { generateLeadNumber, normalizePhone } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const leadsData = body.leads;

    if (!Array.isArray(leadsData) || leadsData.length === 0) {
      return NextResponse.json(
        { error: "No leads data provided for import." },
        { status: 400 }
      );
    }

    if (leadsData.length > 500) {
      return NextResponse.json(
        { error: "Bulk import limit is 500 leads per batch." },
        { status: 400 }
      );
    }

    // Pre-fetch all projects and available units for quick lookup
    const [allProjects, allUnits] = await Promise.all([
      prisma.project.findMany({ select: { id: true, name: true, code: true } }),
      prisma.unit.findMany({
        where: { status: "AVAILABLE" },
        select: { id: true, unitNumber: true, projectId: true, finalPrice: true, unitType: true },
      }),
    ]);

    let importedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < leadsData.length; i++) {
      const row = leadsData[i];
      let lastName = (row.lastName || row["Last Name"] || "").trim();
      let firstName = (row.firstName || row["First Name"] || "").trim();

      // If full name was supplied in a single column
      if (!lastName && (row.name || row.fullName || row["Full Name"])) {
        const parts = (row.name || row.fullName || row["Full Name"]).trim().split(/\s+/);
        if (parts.length > 1) {
          firstName = parts.slice(0, -1).join(" ");
          lastName = parts[parts.length - 1];
        } else {
          lastName = parts[0] || "Prospect";
        }
      }

      if (!lastName) {
        skippedCount++;
        errors.push(`Row ${i + 1}: Missing Last Name or Name`);
        continue;
      }

      const rawMobile = (row.mobile || row.phone || row["Mobile Phone"] || row["Mobile"] || row["Phone"] || "").toString().trim();
      const rawEmail = (row.email || row["Email"] || row["Email Address"] || "").toString().trim().toLowerCase();

      const normalizedMobile = rawMobile ? normalizePhone(rawMobile) : "0000000000";

      // Duplicate detection
      if (rawMobile || rawEmail) {
        const existing = await prisma.lead.findFirst({
          where: {
            OR: [
              ...(rawMobile ? [{ mobile: normalizedMobile }] : []),
              ...(rawEmail ? [{ email: rawEmail }] : []),
            ],
            isArchived: false,
          },
        });

        if (existing) {
          skippedCount++;
          errors.push(`Row ${i + 1}: Lead already exists (${existing.leadNumber})`);
          continue;
        }
      }

      // Match Project if specified
      const projectInput = (row.project || row.projectName || row["Project Development"] || row["Project"] || "").trim().toLowerCase();
      let matchedProject: any = null;
      if (projectInput) {
        matchedProject = allProjects.find(
          (p) =>
            p.id.toLowerCase() === projectInput ||
            p.name.toLowerCase().includes(projectInput) ||
            (p.code && p.code.toLowerCase() === projectInput)
        );
      }

      // Match Unit if specified
      const unitInput = (row.unit || row.unitNumber || row["Allocated Unit"] || row["Unit"] || "").toString().trim().toLowerCase().replace(/^unit\s*#?/i, "").trim();
      let matchedUnit: any = null;
      if (unitInput) {
        matchedUnit = allUnits.find((u) => {
          const matchNum = u.unitNumber.toLowerCase() === unitInput || u.unitNumber.toLowerCase().includes(unitInput);
          if (matchedProject) {
            return matchNum && u.projectId === matchedProject.id;
          }
          return matchNum;
        });

        if (matchedUnit && !matchedProject) {
          matchedProject = allProjects.find((p) => p.id === matchedUnit!.projectId) || null;
        }
      }

      const company = (row.company || row["Company"] || row["Company Name"] || "").trim() || null;
      const budgetRaw = row.budget || row.budgetMax || row["Estimated Budget"] || row["Budget"];
      const budgetMax = budgetRaw
        ? parseFloat(budgetRaw.toString().replace(/[^0-9.]/g, ""))
        : matchedUnit?.finalPrice || null;

      const ratingInput = (row.rating || row["Rating"] || "WARM").toUpperCase();
      const rating = ["HOT", "WARM", "COLD"].includes(ratingInput) ? ratingInput : "WARM";

      const statusInput = (row.status || row["Status"] || "NEW").toUpperCase();
      const status = ["NEW", "CONTACTED", "QUALIFIED", "LOST"].includes(statusInput) ? statusInput : "NEW";

      const sourceInput = (row.source || row["Source"] || "BULK_IMPORT").toUpperCase().replace(/\s+/g, "_");
      const notes = (row.notes || row.qualificationNotes || row["Qualification Notes"] || row["Notes"] || "").trim() || null;

      try {
        await prisma.lead.create({
          data: {
            leadNumber: generateLeadNumber(),
            firstName: firstName || "",
            lastName: lastName,
            company,
            email: rawEmail || null,
            mobile: normalizedMobile,
            whatsapp: normalizedMobile,
            rating,
            temperature: rating,
            status,
            source: sourceInput,
            budgetMax,
            projectId: matchedProject ? matchedProject.id : null,
            interestedProject: matchedProject ? matchedProject.name : null,
            unitId: matchedUnit ? matchedUnit.id : null,
            propertyType: matchedUnit?.unitType || "APARTMENT",
            qualificationNotes: notes,
            assignedAdvisorId: user.id,
            createdById: user.id,
          },
        });
        importedCount++;
      } catch (err: any) {
        console.error(`Row ${i + 1} insert error:`, err);
        skippedCount++;
        errors.push(`Row ${i + 1}: ${err.message || "Failed to create lead"}`);
      }
    }

    if (importedCount > 0) {
      await prisma.activity.create({
        data: {
          type: "SYSTEM",
          subject: `Bulk Lead Import: ${importedCount} leads created`,
          description: `User ${user.firstName || user.email || "User"} imported ${importedCount} leads via CSV batch upload. (${skippedCount} rows skipped/duplicates).`,
          createdById: user.id,
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      importedCount,
      skippedCount,
      errors: errors.slice(0, 10),
      totalProcessed: leadsData.length,
    });
  } catch (error) {
    console.error("Bulk import leads error:", error);
    return NextResponse.json({ error: "Failed to process bulk import" }, { status: 500 });
  }
}
