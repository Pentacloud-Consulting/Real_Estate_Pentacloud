import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const dbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_DATABASE_URL ||
  process.env.POSTGRES_DATABASE_URL_POOLED ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL;

if (dbUrl) {
  process.env.DATABASE_URL = dbUrl;
}

const prisma = new PrismaClient({
  datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
});

async function main() {
  console.log("Seeding Pentacloud Real Estate Platform Database...");

  // Preserve existing data: If database is already populated, skip seed
  const existingUsersCount = await prisma.user.count().catch(() => 0);
  if (existingUsersCount > 0) {
    console.log(`[seed] Database already initialized with ${existingUsersCount} users. Skipping seed to preserve data.`);
    return;
  }

  await prisma.documentVerification.deleteMany().catch(() => {});
  await prisma.document.deleteMany().catch(() => {});
  await prisma.onboardingChecklist.deleteMany().catch(() => {});
  await prisma.onboarding.deleteMany().catch(() => {});
  await prisma.paymentMilestone.deleteMany().catch(() => {});
  await prisma.purchaseOrder.deleteMany().catch(() => {});
  await prisma.quotation.deleteMany().catch(() => {});
  await prisma.reservation.deleteMany().catch(() => {});
  await prisma.eOI.deleteMany().catch(() => {});
  await prisma.opportunityStageHistory.deleteMany().catch(() => {});
  await prisma.opportunity.deleteMany().catch(() => {});
  await prisma.followUp.deleteMany().catch(() => {});
  await prisma.activity.deleteMany().catch(() => {});
  await prisma.notification.deleteMany().catch(() => {});
  await prisma.auditLog.deleteMany().catch(() => {});
  await prisma.unit.deleteMany().catch(() => {});
  await prisma.building.deleteMany().catch(() => {});
  await prisma.lead.deleteMany().catch(() => {});
  await prisma.buyerAccount.deleteMany().catch(() => {});
  await prisma.project.deleteMany().catch(() => {});
  await prisma.user.deleteMany().catch(() => {});
  await prisma.systemSetting.deleteMany().catch(() => {});

  const passwordHash = await bcrypt.hash("admin123", 10);

  // 1. Users & Roles
  console.log("Creating users...");
  const admin = await prisma.user.create({
    data: {
      email: "admin@pentacloud.com",
      passwordHash,
      firstName: "Ahmed",
      lastName: "Al Rashid",
      role: "SUPER_ADMIN",
      phone: "+971 50 100 2000",
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      email: "ops@pentacloud.com",
      passwordHash,
      firstName: "Fatima",
      lastName: "Al Mansoor",
      role: "ADMIN",
      phone: "+971 50 200 3000",
      isActive: true,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: "manager@pentacloud.com",
      passwordHash,
      firstName: "Omar",
      lastName: "Farooq",
      role: "SALES_MANAGER",
      phone: "+971 50 300 4000",
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      email: "advisor1@pentacloud.com",
      passwordHash,
      firstName: "Sara",
      lastName: "Malik",
      role: "SALES_ADVISOR",
      phone: "+971 50 400 5000",
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      email: "advisor2@pentacloud.com",
      passwordHash,
      firstName: "Khalid",
      lastName: "Tariq",
      role: "SALES_ADVISOR",
      phone: "+971 50 500 6000",
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      email: "finance@pentacloud.com",
      passwordHash,
      firstName: "Layla",
      lastName: "Zayed",
      role: "FINANCE",
      phone: "+971 50 600 7000",
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      email: "compliance@pentacloud.com",
      passwordHash,
      firstName: "Yusuf",
      lastName: "Ibrahim",
      role: "COMPLIANCE",
      phone: "+971 50 700 8000",
      isActive: true,
    },
  });

  // 2. Projects & Images
  console.log("Creating projects with generated high-res images...");
  const DOWNTOWN_IMAGE = "/images/projects/downtown-crown.jpg";
  const PALM_IMAGE = "/images/projects/palm-villas.jpg";
  const DOWNTOWN_FALLBACK = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80";
  const PALM_FALLBACK = "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80";

  const p1 = await prisma.project.create({
    data: {
      name: "Downtown Crown Residences",
      code: "DCR",
      developer: "Pentacloud Properties",
      description: "Iconic ultra-luxury skyscraper situated in the heart of Downtown Dubai directly overlooking Burj Khalifa and Dubai Fountain.",
      location: "Downtown Dubai",
      address: "Sheikh Mohammed bin Rashid Blvd",
      city: "Dubai",
      country: "UAE",
      status: "ACTIVE",
      totalUnits: 5,
      propertyType: "APARTMENT",
      priceRangeMin: 1850000,
      priceRangeMax: 9800000,
      amenities: JSON.stringify(["Burj Khalifa Views", "Infinity Pool", "Private Helipad", "Valet Parking", "Michelin Dining"]),
      imageUrl: JSON.stringify({
        images: [DOWNTOWN_IMAGE, DOWNTOWN_FALLBACK],
        videoUrl: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
      }),
      buildings: {
        create: {
          name: "Crown Tower",
          totalFloors: 45,
          totalUnits: 5,
        },
      },
    },
    include: { buildings: true },
  });

  const p2 = await prisma.project.create({
    data: {
      name: "Palm Island Beachfront Villas",
      code: "PIV",
      developer: "Pentacloud Properties",
      description: "Exclusive private gated beachfront community on Palm Jumeirah with private sandy beaches, rooftop lounges, and private yacht moorage.",
      location: "Palm Jumeirah",
      address: "Frond J, Palm Jumeirah",
      city: "Dubai",
      country: "UAE",
      status: "ACTIVE",
      totalUnits: 5,
      propertyType: "VILLA",
      priceRangeMin: 16500000,
      priceRangeMax: 34000000,
      amenities: JSON.stringify(["Private Beachfront", "Private Lap Pool", "Staff Quarters", "Smart Home Automation", "Private Yacht Jetty"]),
      imageUrl: JSON.stringify({
        images: [PALM_IMAGE, PALM_FALLBACK],
        videoUrl: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
      }),
      buildings: {
        create: {
          name: "Beachfront Frond J",
          totalFloors: 3,
          totalUnits: 5,
        },
      },
    },
    include: { buildings: true },
  });

  // 3. Units / Inventory (5 units each, keeping same image)
  console.log("Creating 5 units for each project with matching project images...");
  const p1Units = [
    {
      unitNumber: "DCR-0101",
      floor: 1,
      unitType: "APARTMENT",
      bedrooms: 1,
      bathrooms: 2,
      area: 950,
      view: "Boulevard & Fountain View",
      basePrice: 1750000,
      finalPrice: 1850000,
    },
    {
      unitNumber: "DCR-0102",
      floor: 1,
      unitType: "APARTMENT",
      bedrooms: 2,
      bathrooms: 3,
      area: 1450,
      view: "Burj Khalifa Full Panorama",
      basePrice: 2600000,
      finalPrice: 2750000,
    },
    {
      unitNumber: "DCR-0201",
      floor: 2,
      unitType: "APARTMENT",
      bedrooms: 2,
      bathrooms: 3,
      area: 1520,
      view: "Dubai Opera & Skyline View",
      basePrice: 2720000,
      finalPrice: 2890000,
    },
    {
      unitNumber: "DCR-0202",
      floor: 2,
      unitType: "APARTMENT",
      bedrooms: 3,
      bathrooms: 4,
      area: 2200,
      view: "Burj Khalifa & Fountain Sunset View",
      basePrice: 4100000,
      finalPrice: 4350000,
    },
    {
      unitNumber: "DCR-PH-01",
      floor: 45,
      unitType: "PENTHOUSE",
      bedrooms: 4,
      bathrooms: 5,
      area: 5400,
      view: "360-Degree Panoramic Sky View",
      basePrice: 9200000,
      finalPrice: 9800000,
    },
  ];

  for (const u of p1Units) {
    await prisma.unit.create({
      data: {
        unitNumber: u.unitNumber,
        projectId: p1.id,
        buildingId: p1.buildings[0]?.id || null,
        floor: u.floor,
        unitType: u.unitType,
        bedrooms: u.bedrooms,
        bathrooms: u.bathrooms,
        area: u.area,
        areaUnit: "SQFT",
        view: u.view,
        basePrice: u.basePrice,
        finalPrice: u.finalPrice,
        status: "AVAILABLE",
        facing: JSON.stringify({
          images: [DOWNTOWN_IMAGE, DOWNTOWN_FALLBACK],
          videoUrl: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
        }),
      },
    });
  }

  const p2Units = [
    {
      unitNumber: "PIV-V01",
      floor: 1,
      unitType: "VILLA",
      bedrooms: 4,
      bathrooms: 5,
      area: 6200,
      view: "Private Beach & Arabian Gulf View",
      basePrice: 15500000,
      finalPrice: 16500000,
    },
    {
      unitNumber: "PIV-V02",
      floor: 1,
      unitType: "VILLA",
      bedrooms: 5,
      bathrooms: 6,
      area: 7800,
      view: "Sunset Sea & Atlantis Panorama",
      basePrice: 19800000,
      finalPrice: 21000000,
    },
    {
      unitNumber: "PIV-V03",
      floor: 1,
      unitType: "VILLA",
      bedrooms: 5,
      bathrooms: 6,
      area: 8200,
      view: "Full Open Sea & Marina Skyline",
      basePrice: 21200000,
      finalPrice: 22500000,
    },
    {
      unitNumber: "PIV-V04",
      floor: 2,
      unitType: "VILLA",
      bedrooms: 6,
      bathrooms: 7,
      area: 9900,
      view: "Direct Lagoon & Royal Beach View",
      basePrice: 26500000,
      finalPrice: 28000000,
    },
    {
      unitNumber: "PIV-V05",
      floor: 2,
      unitType: "VILLA",
      bedrooms: 6,
      bathrooms: 8,
      area: 11500,
      view: "Tip of the Frond Panoramic Ocean",
      basePrice: 32000000,
      finalPrice: 34000000,
    },
  ];

  for (const u of p2Units) {
    await prisma.unit.create({
      data: {
        unitNumber: u.unitNumber,
        projectId: p2.id,
        buildingId: p2.buildings[0]?.id || null,
        floor: u.floor,
        unitType: u.unitType,
        bedrooms: u.bedrooms,
        bathrooms: u.bathrooms,
        area: u.area,
        areaUnit: "SQFT",
        view: u.view,
        basePrice: u.basePrice,
        finalPrice: u.finalPrice,
        status: "AVAILABLE",
        facing: JSON.stringify({
          images: [PALM_IMAGE, PALM_FALLBACK],
          videoUrl: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
        }),
      },
    });
  }

  console.log("✅ Seed completed successfully with core users, projects, and inventory units. Zero dummy leads seeded.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
