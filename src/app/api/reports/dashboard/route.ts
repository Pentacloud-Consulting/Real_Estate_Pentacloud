import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all"; // today, week, month, quarter, all

    const now = new Date();
    let startDate: Date | undefined;

    if (filter === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (filter === "week") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      startDate = new Date(now.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
    } else if (filter === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (filter === "quarter") {
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterMonth, 1);
    }

    const dateWhere = startDate ? { gte: startDate } : undefined;
    const leadDateClause = dateWhere ? { createdAt: dateWhere } : {};
    const oppDateClause = dateWhere ? { createdAt: dateWhere } : {};

    const [
      totalLeads,
      newLeads,
      qualifiedLeads,
      convertedLeads,
      totalContacts,
      totalAccounts,
      openOpportunities,
      wonOpportunities,
      lostOpportunities,
      pipelineSum,
      leadsByStatusRaw,
      oppsByStageRaw,
      recentLeads,
      recentAccounts,
      recentActivities,
      tasksDueToday,
    ] = await Promise.all([
      prisma.lead.count({ where: { isArchived: false, ...leadDateClause } }),
      prisma.lead.count({ where: { isArchived: false, status: "NEW", ...leadDateClause } }),
      prisma.lead.count({ where: { isArchived: false, status: "QUALIFIED", ...leadDateClause } }),
      prisma.lead.count({ where: { isArchived: false, isConverted: true, ...leadDateClause } }),
      prisma.contact.count({ where: dateWhere ? { createdAt: dateWhere } : {} }),
      prisma.buyerAccount.count({ where: dateWhere ? { createdAt: dateWhere } : {} }),
      prisma.opportunity.count({
        where: {
          stage: { notIn: ["CLOSED_WON", "CLOSED_LOST"] },
          ...oppDateClause,
        },
      }),
      prisma.opportunity.count({
        where: { stage: "CLOSED_WON", ...oppDateClause },
      }),
      prisma.opportunity.count({
        where: { stage: "CLOSED_LOST", ...oppDateClause },
      }),
      prisma.opportunity.aggregate({
        _sum: { estimatedValue: true, amount: true },
        where: {
          stage: { notIn: ["CLOSED_LOST"] },
          ...oppDateClause,
        },
      }),
      prisma.lead.groupBy({
        by: ["status"],
        _count: { _all: true },
        where: { isArchived: false, ...leadDateClause },
      }),
      prisma.opportunity.groupBy({
        by: ["stage"],
        _count: { _all: true },
        where: oppDateClause,
      }),
      prisma.lead.findMany({
        where: { isArchived: false, ...leadDateClause },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          assignedAdvisor: { select: { firstName: true, lastName: true } },
          broker: { select: { name: true } },
        },
      }),
      prisma.buyerAccount.findMany({
        where: dateWhere ? { createdAt: dateWhere } : {},
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          _count: { select: { contacts: true, opportunities: true } },
        },
      }),
      prisma.activity.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          createdBy: { select: { firstName: true, lastName: true } },
          lead: { select: { firstName: true, lastName: true } },
          buyer: { select: { name: true, companyName: true, firstName: true, lastName: true } },
          opportunity: { select: { name: true, opportunityNumber: true } },
        },
      }),
      prisma.followUp.findMany({
        where: { status: { in: ["PENDING", "OVERDUE"] } },
        orderBy: { dueDate: "asc" },
        take: 5,
        include: {
          assignedTo: { select: { firstName: true, lastName: true } },
          lead: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    const pipelineValue = pipelineSum._sum.amount || pipelineSum._sum.estimatedValue || 0;
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    return NextResponse.json({
      kpis: {
        totalLeads,
        newLeads,
        qualifiedLeads,
        convertedLeads,
        totalContacts,
        totalAccounts,
        openOpportunities,
        wonOpportunities,
        lostOpportunities,
        pipelineValue,
        conversionRate,
      },
      leadsByStatus: leadsByStatusRaw.map((s) => ({
        status: s.status,
        count: s._count._all,
      })),
      oppsByStage: oppsByStageRaw.map((s) => ({
        stage: s.stage,
        count: s._count._all,
      })),
      recentLeads: recentLeads.map((l) => ({
        id: l.id,
        leadNumber: l.leadNumber,
        name: `${l.firstName} ${l.lastName}`,
        company: l.company || "Individual",
        status: l.status,
        rating: l.rating || "WARM",
        advisor: l.assignedAdvisor ? `${l.assignedAdvisor.firstName} ${l.assignedAdvisor.lastName}` : "Unassigned",
        createdAt: l.createdAt.toISOString(),
      })),
      recentAccounts: recentAccounts.map((a) => ({
        id: a.id,
        accountNumber: a.accountNumber,
        name: a.name || a.companyName || `${a.firstName || ""} ${a.lastName || ""}`.trim() || "Account",
        industry: a.industry || "Real Estate",
        contactsCount: a._count.contacts,
        oppsCount: a._count.opportunities,
        createdAt: a.createdAt.toISOString(),
      })),
      recentActivities: recentActivities.map((a) => ({
        id: a.id,
        type: a.type,
        subject: a.subject,
        description: a.description,
        relatedName: a.opportunity?.name || a.lead ? `${a.lead?.firstName} ${a.lead?.lastName}` : a.buyer?.name || "CRM Record",
        createdBy: `${a.createdBy.firstName} ${a.createdBy.lastName}`,
        createdAt: a.createdAt.toISOString(),
      })),
      tasksDueToday: tasksDueToday.map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate.toISOString(),
        assignedTo: `${t.assignedTo.firstName} ${t.assignedTo.lastName}`,
        client: t.lead ? `${t.lead.firstName} ${t.lead.lastName}` : "Client",
        priority: t.priority,
        status: t.status,
      })),
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Failed to load dashboard metrics" }, { status: 500 });
  }
}
