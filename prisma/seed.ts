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

  // 2. Projects
  console.log("Creating projects...");
  const p1 = await prisma.project.create({
    data: {
      name: "Azure Marina Residences",
      code: "AMR",
      developer: "Pentacloud Properties",
      description: "Ultra-luxury waterfront high-rise development in Dubai Marina featuring panoramic yacht club views, infinity pools, and smart-home integration.",
      location: "Dubai Marina",
      address: "Plot 392-1200, Marina Promenade",
      city: "Dubai",
      country: "United Arab Emirates",
      status: "ACTIVE",
      totalUnits: 120,
      propertyType: "APARTMENT",
      priceRangeMin: 1200000,
      priceRangeMax: 6500000,
      amenities: JSON.stringify(["Marina Yacht Club Access", "Skyline Infinity Pool", "Valet Parking", "Wellness Spa & Gym", "Private Cinema", "Concierge Service"]),
    },
  });

  const p2 = await prisma.project.create({
    data: {
      name: "Palm Vista Mansions",
      code: "PVM",
      developer: "Pentacloud Properties",
      description: "Exclusive gated beachfront villa community on Palm Jumeirah with private beaches, rooftop terraces, and personalized security.",
      location: "Palm Jumeirah",
      address: "Frond J, Palm Jumeirah",
      city: "Dubai",
      country: "United Arab Emirates",
      status: "ACTIVE",
      totalUnits: 40,
      propertyType: "VILLA",
      priceRangeMin: 12000000,
      priceRangeMax: 45000000,
      amenities: JSON.stringify(["Private Beachfront", "Private Lap Pool", "Driver & Maid Quarters", "Smart Security", "Private Jetty"]),
    },
  });

  const p3 = await prisma.project.create({
    data: {
      name: "Downtown Heights Tower",
      code: "DHT",
      developer: "Pentacloud Properties",
      description: "Signature skyscraper situated directly facing Burj Khalifa with bespoke penthouses and executive suites.",
      location: "Downtown Dubai",
      address: "Sheikh Mohammed bin Rashid Blvd",
      city: "Dubai",
      country: "United Arab Emirates",
      status: "PRE_LAUNCH",
      totalUnits: 90,
      propertyType: "PENTHOUSE",
      priceRangeMin: 3500000,
      priceRangeMax: 22000000,
      amenities: JSON.stringify(["Direct Mall Access", "Burj Khalifa Views", "Michelin Dining", "Helipad", "Executive Lounge"]),
    },
  });

  // 3. Buildings
  console.log("Creating buildings...");
  const b1 = await prisma.building.create({
    data: {
      name: "Marina Tower East",
      projectId: p1.id,
      totalFloors: 30,
      totalUnits: 60,
    },
  });

  await prisma.building.create({
    data: {
      name: "Marina Tower West",
      projectId: p1.id,
      totalFloors: 30,
      totalUnits: 60,
    },
  });

  const b3 = await prisma.building.create({
    data: {
      name: "The Grand Tower",
      projectId: p3.id,
      totalFloors: 50,
      totalUnits: 90,
    },
  });

  // 4. Units / Inventory (50+ units, 100% AVAILABLE)
  console.log("Creating units...");
  const unitList = [];

  // Tower East Units (Floors 1 to 15, 3 units per floor)
  const views = ["Marina Sea View", "Yacht Club View", "City Skyline", "Courtyard View"];
  for (let floor = 1; floor <= 15; floor++) {
    for (let u = 1; u <= 3; u++) {
      const bedrooms = u === 1 ? 1 : u === 2 ? 2 : 3;
      const area = bedrooms === 1 ? 850 : bedrooms === 2 ? 1350 : 2100;
      const basePrice = bedrooms === 1 ? 1350000 : bedrooms === 2 ? 2200000 : 3400000;
      const floorPremium = floor * 15000;
      const viewPremium = u === 1 ? 75000 : u === 2 ? 120000 : 200000;
      const addCharges = 35000;
      const finalPrice = basePrice + floorPremium + viewPremium + addCharges;

      unitList.push({
        unitNumber: `MTE-${floor.toString().padStart(2, "0")}${u.toString().padStart(2, "0")}`,
        projectId: p1.id,
        buildingId: b1.id,
        floor,
        unitType: "APARTMENT",
        bedrooms,
        bathrooms: bedrooms + 1,
        area,
        areaUnit: "SQFT",
        view: views[(floor + u) % views.length],
        facing: u === 1 ? "North-East" : u === 2 ? "South-East" : "West",
        basePrice,
        floorPremium,
        viewPremium,
        additionalCharges: addCharges,
        finalPrice,
        status: "AVAILABLE",
      });
    }
  }

  // Palm Vista Villas
  for (let v = 1; v <= 10; v++) {
    const bedrooms = v <= 5 ? 5 : 6;
    const area = bedrooms === 5 ? 7200 : 9800;
    const basePrice = bedrooms === 5 ? 16500000 : 28000000;
    const viewPremium = v <= 3 ? 2000000 : 1000000;
    const addCharges = 150000;
    const finalPrice = basePrice + viewPremium + addCharges;

    unitList.push({
      unitNumber: `PVM-VILLA-${v.toString().padStart(2, "0")}`,
      projectId: p2.id,
      buildingId: null,
      floor: 0,
      unitType: "VILLA",
      bedrooms,
      bathrooms: bedrooms + 2,
      area,
      areaUnit: "SQFT",
      view: v <= 4 ? "Direct Private Beachfront" : "Sunset Palm Lagoon",
      facing: v % 2 === 0 ? "North" : "South",
      basePrice,
      floorPremium: 0,
      viewPremium,
      additionalCharges: addCharges,
      finalPrice,
      status: "AVAILABLE",
    });
  }

  // Downtown Penthouses
  for (let pt = 1; pt <= 6; pt++) {
    const bedrooms = 4;
    const area = 5500;
    const basePrice = 8500000 + pt * 800000;
    const finalPrice = basePrice + 350000;

    unitList.push({
      unitNumber: `DHT-PH-${pt.toString().padStart(2, "0")}`,
      projectId: p3.id,
      buildingId: b3.id,
      floor: 40 + pt,
      unitType: "PENTHOUSE",
      bedrooms,
      bathrooms: 5,
      area,
      areaUnit: "SQFT",
      view: "Burj Khalifa & Fountain View",
      facing: "South-West",
      basePrice,
      floorPremium: pt * 100000,
      viewPremium: 250000,
      additionalCharges: 50000,
      finalPrice,
      status: "AVAILABLE",
    });
  }

  await prisma.unit.createMany({ data: unitList });

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
