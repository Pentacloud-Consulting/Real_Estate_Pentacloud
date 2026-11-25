import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Pentacloud Real Estate Platform Database...");

  // Preserve existing data: If database is already populated, skip seed
  const existingUsersCount = await prisma.user.count().catch(() => 0);
  if (existingUsersCount > 0) {
    console.log(`[seed] Database already initialized with ${existingUsersCount} users. Skipping seed to preserve data.`);
    return;
  }
  await prisma.documentVerification.deleteMany();
  await prisma.document.deleteMany();
  await prisma.onboardingChecklist.deleteMany();
  await prisma.onboarding.deleteMany();
  await prisma.paymentMilestone.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.eOI.deleteMany();
  await prisma.opportunityStageHistory.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.building.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.buyerAccount.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSetting.deleteMany();

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

  const ops = await prisma.user.create({
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

  const advisor1 = await prisma.user.create({
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

  const advisor2 = await prisma.user.create({
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

  const finance = await prisma.user.create({
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

  const compliance = await prisma.user.create({
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

  const b2 = await prisma.building.create({
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

  // 4. Units / Inventory (50+ units)
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

      let status = "AVAILABLE";
      if (floor === 3 && u === 1) status = "RESERVED";
      if (floor === 5 && u === 2) status = "SOLD";
      if (floor === 7 && u === 3) status = "SOLD";
      if (floor === 10 && u === 1) status = "ON_HOLD";
      if (floor === 12 && u === 2) status = "RESERVED";

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
        status,
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

    let status = "AVAILABLE";
    if (v === 2) status = "RESERVED";
    if (v === 4) status = "SOLD";

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
      status,
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
      status: pt === 1 ? "RESERVED" : "AVAILABLE",
    });
  }

  await prisma.unit.createMany({ data: unitList });
  const allUnits = await prisma.unit.findMany();

  // 5. Leads (30+ leads across diverse sources & temperatures)
  console.log("Creating leads...");
  const leadSources = [
    "WEBSITE", "INSTAGRAM", "FACEBOOK", "LINKEDIN", "GOOGLE", "WHATSAPP", "WALK_IN", "BROKER", "REFERRAL"
  ];

  const rawLeads = [
    { fn: "Tariq", ln: "Al Suwaidi", m: "+971501112233", e: "tariq.alsuwaidi@example.com", nat: "UAE", cor: "UAE", src: "WEBSITE", temp: "HOT", st: "QUALIFIED", p: "Azure Marina Residences", pt: "APARTMENT", bmin: 2000000, bmax: 3500000, b: "INDIVIDUAL" },
    { fn: "Elena", ln: "Rostova", m: "+79169998877", e: "elena.rostova@example.com", nat: "Russia", cor: "UAE", src: "INSTAGRAM", temp: "HOT", st: "QUALIFIED", p: "Palm Vista Mansions", pt: "VILLA", bmin: 15000000, bmax: 25000000, b: "INDIVIDUAL" },
    { fn: "Rajesh", ln: "Singhania", m: "+919820011223", e: "rajesh.singhania@apexholding.com", nat: "India", cor: "India", src: "LINKEDIN", temp: "HOT", st: "QUALIFIED", p: "Downtown Heights Tower", pt: "PENTHOUSE", bmin: 8000000, bmax: 14000000, b: "CORPORATE" },
    { fn: "Marcus", ln: "Vance", m: "+447700900123", e: "marcus.vance@vancecap.co.uk", nat: "UK", cor: "UK", src: "GOOGLE", temp: "WARM", st: "CONTACTED", p: "Azure Marina Residences", pt: "APARTMENT", bmin: 1500000, bmax: 2500000, b: "INDIVIDUAL" },
    { fn: "Zaid", ln: "Al Nuaimi", m: "+971524433221", e: "zaid.nuaimi@example.ae", nat: "UAE", cor: "UAE", src: "WALK_IN", temp: "HOT", st: "QUALIFIED", p: "Azure Marina Residences", pt: "APARTMENT", bmin: 2500000, bmax: 4000000, b: "INDIVIDUAL" },
    { fn: "Sophia", ln: "Laurent", m: "+33612349876", e: "sophia.laurent@luxliving.fr", nat: "France", cor: "France", src: "FACEBOOK", temp: "WARM", st: "CONTACTED", p: "Palm Vista Mansions", pt: "VILLA", bmin: 12000000, bmax: 18000000, b: "INDIVIDUAL" },
    { fn: "Chen", ln: "Hong", m: "+8613800138000", e: "chen.hong@chinainvest.cn", nat: "China", cor: "China", src: "BROKER", temp: "HOT", st: "QUALIFIED", p: "Downtown Heights Tower", pt: "PENTHOUSE", bmin: 10000000, bmax: 20000000, b: "CORPORATE" },
    { fn: "Khadija", ln: "Al Marzooqi", m: "+971507766554", e: "khadija.m@example.com", nat: "UAE", cor: "UAE", src: "REFERRAL", temp: "HOT", st: "QUALIFIED", p: "Azure Marina Residences", pt: "APARTMENT", bmin: 1800000, bmax: 2800000, b: "INDIVIDUAL" },
    { fn: "Alexander", ln: "Schmidt", m: "+491701122334", e: "a.schmidt@berlin-tech.de", nat: "Germany", cor: "Germany", src: "WHATSAPP", temp: "WARM", st: "CONTACTED", p: "Azure Marina Residences", pt: "APARTMENT", bmin: 1200000, bmax: 2000000, b: "INDIVIDUAL" },
    { fn: "Nasser", ln: "Al Otaiba", m: "+971509988112", e: "nasser.otaiba@example.ae", nat: "UAE", cor: "UAE", src: "WALK_IN", temp: "HOT", st: "NEW", p: "Palm Vista Mansions", pt: "VILLA", bmin: 16000000, bmax: 30000000, b: "INDIVIDUAL" },
    { fn: "Amina", ln: "Bello", m: "+2348031234567", e: "amina.bello@lagoscap.ng", nat: "Nigeria", cor: "Nigeria", src: "WEBSITE", temp: "WARM", st: "NEW", p: "Downtown Heights Tower", pt: "APARTMENT", bmin: 3000000, bmax: 5000000, b: "INDIVIDUAL" },
    { fn: "Dmitry", ln: "Volkov", m: "+79031234567", e: "d.volkov@trade.ru", nat: "Russia", cor: "UAE", src: "BROKER", temp: "HOT", st: "CONTACTED", p: "Palm Vista Mansions", pt: "VILLA", bmin: 20000000, bmax: 35000000, b: "INDIVIDUAL" },
    { fn: "Jessica", ln: "Miller", m: "+14155552671", e: "jmiller@siliconinv.com", nat: "USA", cor: "USA", src: "LINKEDIN", temp: "WARM", st: "NEW", p: "Downtown Heights Tower", pt: "PENTHOUSE", bmin: 9000000, bmax: 15000000, b: "INDIVIDUAL" },
    { fn: "Faisal", ln: "Al Thani", m: "+97455123456", e: "faisal.thani@doha.qa", nat: "Qatar", cor: "Qatar", src: "REFERRAL", temp: "HOT", st: "QUALIFIED", p: "Palm Vista Mansions", pt: "VILLA", bmin: 25000000, bmax: 40000000, b: "INDIVIDUAL" },
    { fn: "Oliver", ln: "Brown", m: "+442079460912", e: "oliver.brown@londonwealth.com", nat: "UK", cor: "UK", src: "GOOGLE", temp: "COLD", st: "UNQUALIFIED", p: "Azure Marina Residences", pt: "APARTMENT", bmin: 800000, bmax: 1000000, b: "INDIVIDUAL" },
    { fn: "Hamad", ln: "Al Ketbi", m: "+971505544332", e: "hamad.ketbi@emirates.ae", nat: "UAE", cor: "UAE", src: "WEBSITE", temp: "WARM", st: "CONTACTED", p: "Azure Marina Residences", pt: "APARTMENT", bmin: 2000000, bmax: 3000000, b: "INDIVIDUAL" },
    { fn: "Mei", ln: "Ling", m: "+6591234567", e: "meiling@sginvest.sg", nat: "Singapore", cor: "Singapore", src: "INSTAGRAM", temp: "HOT", st: "NEW", p: "Downtown Heights Tower", pt: "APARTMENT", bmin: 4000000, bmax: 7000000, b: "INDIVIDUAL" },
    { fn: "Kareem", ln: "Fahmy", m: "+201001234567", e: "kareem.fahmy@cairogroup.eg", nat: "Egypt", cor: "UAE", src: "WHATSAPP", temp: "WARM", st: "CONTACTED", p: "Azure Marina Residences", pt: "APARTMENT", bmin: 1500000, bmax: 2200000, b: "INDIVIDUAL" },
    { fn: "Sven", ln: "Nilsson", m: "+46701234567", e: "sven.nilsson@nordic.se", nat: "Sweden", cor: "Sweden", src: "GOOGLE", temp: "WARM", st: "NEW", p: "Azure Marina Residences", pt: "APARTMENT", bmin: 1800000, bmax: 2500000, b: "INDIVIDUAL" },
    { fn: "Noor", ln: "Al Hashimi", m: "+971528877665", e: "noor.hashimi@example.com", nat: "UAE", cor: "UAE", src: "WALK_IN", temp: "HOT", st: "QUALIFIED", p: "Azure Marina Residences", pt: "APARTMENT", bmin: 2200000, bmax: 3200000, b: "INDIVIDUAL" },
  ];

  const advisors = [advisor1.id, advisor2.id];
  const createdLeads = [];

  for (let i = 0; i < rawLeads.length; i++) {
    const rl = rawLeads[i];
    const advisorId = advisors[i % advisors.length];
    const createdDate = new Date(Date.now() - (i * 2 + 1) * 86400000);

    const lead = await prisma.lead.create({
      data: {
        leadNumber: `LD-${(20000 + i + 1).toString()}`,
        firstName: rl.fn,
        lastName: rl.ln,
        email: rl.e,
        mobile: rl.m,
        whatsapp: rl.m,
        nationality: rl.nat,
        countryOfResidence: rl.cor,
        preferredLanguage: "English",
        buyerType: rl.b,
        interestedProject: rl.p,
        propertyType: rl.pt,
        bedroomCount: "2",
        budgetMin: rl.bmin,
        budgetMax: rl.bmax,
        purchasePurpose: i % 2 === 0 ? "INVESTMENT" : "END_USE",
        preferredPaymentPlan: "40/60 Construction Linked",
        expectedTimeline: "Within 30 Days",
        source: rl.src,
        campaignName: "Q1 Global Investor Campaign",
        campaignId: "CAMP-Q1-2026",
        temperature: rl.temp,
        status: rl.st,
        qualificationScore: rl.temp === "HOT" ? 85 : rl.temp === "WARM" ? 65 : 40,
        qualificationNotes: `Buyer has confirmed liquid funds and is interested in ${rl.p}. Needs priority unit selection.`,
        assignedAdvisorId: advisorId,
        salesManagerId: manager.id,
        nextFollowUpDate: new Date(Date.now() + (i % 5 + 1) * 86400000),
        createdById: admin.id,
        createdAt: createdDate,
      },
    });
    createdLeads.push(lead);
  }

  // 6. Buyers & Opportunities (Create 6 realistic buyers from leads)
  console.log("Creating buyers, opportunities, and transaction lifecycles...");

  // Buyer 1: Local Resident (Tariq Al Suwaidi)
  const bAccount1 = await prisma.buyerAccount.create({
    data: {
      accountNumber: "BA-88001",
      buyerType: "INDIVIDUAL",
      firstName: "Tariq",
      lastName: "Al Suwaidi",
      email: "tariq.alsuwaidi@example.com",
      mobile: "+971501112233",
      whatsapp: "+971501112233",
      nationality: "United Arab Emirates",
      countryOfResidence: "United Arab Emirates",
      preferredLanguage: "Arabic",
      passportNumber: "N7894561",
      nationalId: "784-1988-1234567-1",
      addressLine1: "Villa 42, Al Wasl Road",
      city: "Dubai",
      country: "United Arab Emirates",
      relationshipManagerId: advisor1.id,
      createdById: admin.id,
    },
  });

  // Buyer 2: International Buyer (Elena Rostova)
  const bAccount2 = await prisma.buyerAccount.create({
    data: {
      accountNumber: "BA-88002",
      buyerType: "INDIVIDUAL",
      firstName: "Elena",
      lastName: "Rostova",
      email: "elena.rostova@example.com",
      mobile: "+79169998877",
      whatsapp: "+79169998877",
      nationality: "Russian Federation",
      countryOfResidence: "United Arab Emirates",
      preferredLanguage: "English",
      passportNumber: "75N984512",
      nationalId: "RU-44892019",
      addressLine1: "Apt 2204, Bluewaters Residences",
      city: "Dubai",
      country: "United Arab Emirates",
      relationshipManagerId: advisor2.id,
      createdById: admin.id,
    },
  });

  // Buyer 3: Corporate Buyer (Apex Global Ventures / Rajesh Singhania)
  const bAccount3 = await prisma.buyerAccount.create({
    data: {
      accountNumber: "BA-88003",
      buyerType: "CORPORATE",
      companyName: "Apex Global Ventures Holdings LLC",
      tradeLicenseNumber: "TL-DXB-998811",
      registrationNumber: "REG-2022-8711",
      taxRegistration: "TRN-100299883344",
      registeredAddress: "Level 28, Al Fattan Currency House, DIFC",
      city: "Dubai",
      country: "United Arab Emirates",
      companyContact: "+971 4 330 9000",
      authorizedSignatory: "Rajesh Singhania (Managing Director)",
      beneficialOwners: JSON.stringify([{ name: "Rajesh Singhania", share: 70 }, { name: "Ananya Singhania", share: 30 }]),
      email: "finance@apexholding.com",
      mobile: "+971529988776",
      relationshipManagerId: advisor1.id,
      createdById: admin.id,
    },
  });

  // Buyer 4: International High Net Worth (Faisal Al Thani)
  const bAccount4 = await prisma.buyerAccount.create({
    data: {
      accountNumber: "BA-88004",
      buyerType: "INDIVIDUAL",
      firstName: "Faisal",
      lastName: "Al Thani",
      email: "faisal.thani@doha.qa",
      mobile: "+97455123456",
      nationality: "Qatar",
      countryOfResidence: "Qatar",
      preferredLanguage: "Arabic",
      passportNumber: "QAT-998812",
      city: "Doha",
      country: "Qatar",
      relationshipManagerId: advisor2.id,
      createdById: admin.id,
    },
  });

  // Opportunities
  const opp1 = await prisma.opportunity.create({
    data: {
      opportunityNumber: "OPP-99001",
      name: "Tariq Al Suwaidi - Azure Marina 2BR Waterfront",
      buyerId: bAccount1.id,
      projectId: p1.id,
      unitId: allUnits[0].id,
      propertyType: "APARTMENT",
      estimatedValue: allUnits[0].finalPrice,
      budget: 2500000,
      probability: 90,
      expectedClosingDate: new Date(Date.now() + 15 * 86400000),
      stage: "PURCHASE_ORDER",
      assignedAdvisorId: advisor1.id,
      salesManagerId: manager.id,
      createdById: admin.id,
    },
  });

  const opp2 = await prisma.opportunity.create({
    data: {
      opportunityNumber: "OPP-99002",
      name: "Elena Rostova - Palm Vista Beach Villa",
      buyerId: bAccount2.id,
      projectId: p2.id,
      unitId: allUnits[46].id,
      propertyType: "VILLA",
      estimatedValue: allUnits[46].finalPrice,
      budget: 20000000,
      probability: 80,
      expectedClosingDate: new Date(Date.now() + 20 * 86400000),
      stage: "EOI",
      assignedAdvisorId: advisor2.id,
      salesManagerId: manager.id,
      createdById: admin.id,
    },
  });

  const opp3 = await prisma.opportunity.create({
    data: {
      opportunityNumber: "OPP-99003",
      name: "Apex Global - Downtown Heights Sky Penthouse",
      buyerId: bAccount3.id,
      projectId: p3.id,
      unitId: allUnits[55].id,
      propertyType: "PENTHOUSE",
      estimatedValue: allUnits[55].finalPrice,
      budget: 15000000,
      probability: 70,
      expectedClosingDate: new Date(Date.now() + 30 * 86400000),
      stage: "NEGOTIATION",
      assignedAdvisorId: advisor1.id,
      salesManagerId: manager.id,
      createdById: admin.id,
    },
  });

  // 7. EOI & Unit Reservation for Tariq Al Suwaidi
  console.log("Creating EOI, Reservations, Quotation and Purchase Order...");
  const targetUnit = allUnits[0]; // MTE-0101
  const tokenAmt = 100000;

  const eoi1 = await prisma.eOI.create({
    data: {
      eoiNumber: "EOI-55001",
      buyerId: bAccount1.id,
      opportunityId: opp1.id,
      projectId: p1.id,
      unitId: targetUnit.id,
      eoiDate: new Date(Date.now() - 5 * 86400000),
      unitPrice: targetUnit.finalPrice,
      tokenAmount: tokenAmt,
      isRefundable: false,
      paymentMethod: "BANK_TRANSFER",
      paymentReference: "FT-DXB-98712365",
      paymentStatus: "VERIFIED",
      status: "CONVERTED_TO_PO",
      verifiedById: finance.id,
      verifiedAt: new Date(Date.now() - 4 * 86400000),
      createdById: advisor1.id,
    },
  });

  // Reservation for targetUnit
  await prisma.reservation.create({
    data: {
      reservationNumber: "RES-33001",
      buyerId: bAccount1.id,
      projectId: p1.id,
      unitId: targetUnit.id,
      eoiId: eoi1.id,
      reservationDate: new Date(Date.now() - 4 * 86400000),
      expiryDate: new Date(Date.now() + 10 * 86400000),
      tokenAmount: tokenAmt,
      paymentStatus: "CONFIRMED",
      status: "ACTIVE",
      assignedAdvisorId: advisor1.id,
      notes: "Token verified by finance. Unit locked for Tariq Al Suwaidi.",
    },
  });

  // Mark unit as RESERVED
  await prisma.unit.update({
    where: { id: targetUnit.id },
    data: { status: "RESERVED" },
  });

  // Quotation with Payment Plan
  const qtn1 = await prisma.quotation.create({
    data: {
      quotationNumber: "QTN-77001",
      version: 1,
      buyerId: bAccount1.id,
      projectId: p1.id,
      unitId: targetUnit.id,
      opportunityId: opp1.id,
      eoiId: eoi1.id,
      basePrice: targetUnit.basePrice,
      floorPremium: targetUnit.floorPremium,
      viewPremium: targetUnit.viewPremium,
      otherFees: targetUnit.additionalCharges,
      discount: 25000,
      tax: 0,
      finalPrice: targetUnit.finalPrice - 25000,
      currency: "AED",
      validUntil: new Date(Date.now() + 14 * 86400000),
      status: "APPROVED",
      approvedById: manager.id,
      approvedAt: new Date(Date.now() - 3 * 86400000),
      createdById: advisor1.id,
      termsConditions: "1. 10% Down Payment due upon signing SPA.\n2. Balance spread over construction milestones as per schedule.\n3. Handover scheduled for Q4 2026.",
    },
  });

  // Payment Milestones (Validates to 100%)
  const qtnFinal = targetUnit.finalPrice - 25000;
  await prisma.paymentMilestone.createMany({
    data: [
      { quotationId: qtn1.id, name: "Booking / EOI Token", percentage: 5, amount: qtnFinal * 0.05, status: "PAID", paymentReference: "FT-DXB-98712365", sortOrder: 1 },
      { quotationId: qtn1.id, name: "Down Payment (on Signing)", percentage: 15, amount: qtnFinal * 0.15, dueDate: new Date(Date.now() + 7 * 86400000), status: "PENDING", sortOrder: 2 },
      { quotationId: qtn1.id, name: "Milestone 1: 20% Construction", percentage: 10, amount: qtnFinal * 0.10, dueDate: new Date(Date.now() + 90 * 86400000), status: "PENDING", sortOrder: 3 },
      { quotationId: qtn1.id, name: "Milestone 2: 40% Construction", percentage: 10, amount: qtnFinal * 0.10, dueDate: new Date(Date.now() + 180 * 86400000), status: "PENDING", sortOrder: 4 },
      { quotationId: qtn1.id, name: "Milestone 3: 60% Construction", percentage: 10, amount: qtnFinal * 0.10, dueDate: new Date(Date.now() + 270 * 86400000), status: "PENDING", sortOrder: 5 },
      { quotationId: qtn1.id, name: "Milestone 4: 80% Construction", percentage: 10, amount: qtnFinal * 0.10, dueDate: new Date(Date.now() + 360 * 86400000), status: "PENDING", sortOrder: 6 },
      { quotationId: qtn1.id, name: "Handover & Final Completion", percentage: 40, amount: qtnFinal * 0.40, dueDate: new Date(Date.now() + 500 * 86400000), status: "PENDING", sortOrder: 7 },
    ],
  });

  // Purchase Order
  const po1 = await prisma.purchaseOrder.create({
    data: {
      poNumber: "PO-44001",
      buyerId: bAccount1.id,
      projectId: p1.id,
      unitId: targetUnit.id,
      opportunityId: opp1.id,
      quotationId: qtn1.id,
      eoiId: eoi1.id,
      unitPrice: targetUnit.finalPrice,
      discount: 25000,
      additionalCharges: targetUnit.additionalCharges,
      finalAmount: qtnFinal,
      downPayment: qtnFinal * 0.20,
      paymentPlan: "Construction Linked 60/40",
      status: "APPROVED",
      approvedById: ops.id,
      approvedAt: new Date(Date.now() - 2 * 86400000),
      createdById: advisor1.id,
      notes: "Purchase order approved by operations. Ready for buyer countersignature and KYC submission.",
    },
  });

  // 8. Buyer Onboarding & Checklist
  console.log("Setting up Buyer Onboarding workflows and KYC checklists...");

  // Onboarding 1: Tariq Al Suwaidi (INDIVIDUAL_RESIDENT)
  const onb1 = await prisma.onboarding.create({
    data: {
      onboardingNumber: "ONB-11001",
      buyerId: bAccount1.id,
      buyerCategory: "INDIVIDUAL_RESIDENT",
      status: "IN_PROGRESS",
      completionPercentage: 60,
      reviewerId: compliance.id,
      submissionDate: new Date(Date.now() - 2 * 86400000),
      notes: "Local resident onboarding. Emirates ID and Passport verified. Tenancy contract under review.",
    },
  });

  const residentDocs = [
    { name: "Valid National ID / Emirates ID — Front and Back", isReq: true, status: "VERIFIED" },
    { name: "Valid Passport Copy", isReq: true, status: "VERIFIED" },
    { name: "Proof of Current Residential Address — Utility Bill or Tenancy Contract", isReq: true, status: "UNDER_REVIEW" },
    { name: "Signed KYC & Source of Funds Declaration Form", isReq: true, status: "VERIFIED" },
    { name: "Down-Payment Transfer Receipt / Cheque Copy", isReq: true, status: "PENDING_UPLOAD" },
  ];

  for (let i = 0; i < residentDocs.length; i++) {
    const item = residentDocs[i];
    const chk = await prisma.onboardingChecklist.create({
      data: {
        onboardingId: onb1.id,
        documentName: item.name,
        isRequired: item.isReq,
        status: item.status,
        sortOrder: i + 1,
      },
    });

    if (item.status === "VERIFIED" || item.status === "UNDER_REVIEW") {
      const doc = await prisma.document.create({
        data: {
          fileName: `tariq_doc_${i + 1}.pdf`,
          originalName: `${item.name.slice(0, 20)}.pdf`,
          mimeType: "application/pdf",
          fileSize: 1024 * 240,
          filePath: `/uploads/mock/tariq_${i + 1}.pdf`,
          category: "KYC",
          buyerId: bAccount1.id,
          checklistItemId: chk.id,
          status: item.status,
          uploadedById: advisor1.id,
        },
      });

      if (item.status === "VERIFIED") {
        await prisma.documentVerification.create({
          data: {
            documentId: doc.id,
            action: "VERIFIED",
            notes: "Verified against government identity registry.",
            verifiedById: compliance.id,
          },
        });
      }
    }
  }

  // Onboarding 2: Elena Rostova (INDIVIDUAL_INTERNATIONAL)
  const onb2 = await prisma.onboarding.create({
    data: {
      onboardingNumber: "ONB-11002",
      buyerId: bAccount2.id,
      buyerCategory: "INDIVIDUAL_INTERNATIONAL",
      status: "IN_PROGRESS",
      completionPercentage: 40,
      reviewerId: compliance.id,
      submissionDate: new Date(Date.now() - 1 * 86400000),
      notes: "International buyer onboarding. Waiting for MT103 SWIFT copy.",
    },
  });

  const intlDocs = [
    { name: "Valid Passport Copy — Minimum 6 months validity", isReq: true, status: "VERIFIED" },
    { name: "National ID / Tax ID from Home Country", isReq: true, status: "UNDER_REVIEW" },
    { name: "Proof of Overseas Residential Address", isReq: true, status: "PENDING_UPLOAD" },
    { name: "Signed KYC & Source of Funds Declaration Form", isReq: true, status: "PENDING_UPLOAD" },
    { name: "International Wire Transfer Swift Copy (MT103)", isReq: true, status: "PENDING_UPLOAD" },
  ];

  for (let i = 0; i < intlDocs.length; i++) {
    await prisma.onboardingChecklist.create({
      data: {
        onboardingId: onb2.id,
        documentName: intlDocs[i].name,
        isRequired: intlDocs[i].isReq,
        status: intlDocs[i].status,
        sortOrder: i + 1,
      },
    });
  }

  // Onboarding 3: Corporate Buyer (Apex Global Ventures)
  const onb3 = await prisma.onboarding.create({
    data: {
      onboardingNumber: "ONB-11003",
      buyerId: bAccount3.id,
      buyerCategory: "CORPORATE",
      status: "PENDING_REVIEW",
      completionPercentage: 80,
      reviewerId: compliance.id,
      submissionDate: new Date(Date.now() - 2 * 86400000),
      notes: "Commercial Trade License and Board Resolution uploaded. UBO documentation is under review.",
    },
  });

  const corpDocs = [
    { name: "Valid Commercial Trade License / Certificate of Incorporation", isReq: true, status: "VERIFIED" },
    { name: "Memorandum & Articles of Association (MOA / AOA)", isReq: true, status: "VERIFIED" },
    { name: "Board Resolution Authorizing Property Purchase", isReq: true, status: "VERIFIED" },
    { name: "Passport & ID Copies of Authorized Signatory & Ultimate Beneficial Owners (UBOs)", isReq: true, status: "UNDER_REVIEW" },
    { name: "Company Tax Registration Certificate (TRN / VAT) & Bank Proof", isReq: true, status: "PENDING_UPLOAD" },
  ];

  for (let i = 0; i < corpDocs.length; i++) {
    await prisma.onboardingChecklist.create({
      data: {
        onboardingId: onb3.id,
        documentName: corpDocs[i].name,
        isRequired: corpDocs[i].isReq,
        status: corpDocs[i].status,
        sortOrder: i + 1,
      },
    });
  }

  // 9. Activity Logs & Timeline
  console.log("Generating activity timeline & audit logs...");
  const sampleActivities = [
    { type: "CALL", subject: "Initial Qualification Call", desc: "Spoke with Tariq regarding 2BR layout preference and marina view.", leadId: createdLeads[0].id, createdById: advisor1.id },
    { type: "SITE_VISIT", subject: "Marina Tower Site Visit", desc: "Conducted guided private tour of Marina Tower East show apartment on 12th floor.", leadId: createdLeads[0].id, buyerId: bAccount1.id, projectId: p1.id, createdById: advisor1.id },
    { type: "EOI_EVENT", subject: "EOI Submitted with Token Transfer", desc: "Submitted EOI-55001 with AED 100,000 transfer receipt attached.", buyerId: bAccount1.id, eoiId: eoi1.id, createdById: advisor1.id },
    { type: "PAYMENT_EVENT", subject: "Token Payment Verified", desc: "Finance confirmed receipt of AED 100,000 in escrow account.", buyerId: bAccount1.id, eoiId: eoi1.id, createdById: finance.id },
    { type: "RESERVATION_EVENT", subject: "Unit MTE-0101 Reserved", desc: "Unit MTE-0101 locked exclusively for Tariq Al Suwaidi until expiry.", buyerId: bAccount1.id, unitId: targetUnit.id, createdById: advisor1.id },
    { type: "STATUS_CHANGE", subject: "Quotation QTN-77001 Approved", desc: "Sales Manager approved payment milestones and pricing terms.", buyerId: bAccount1.id, createdById: manager.id },
    { type: "DOCUMENT_EVENT", subject: "KYC Documents Uploaded", desc: "Buyer submitted passport and Emirates ID scans for compliance review.", buyerId: bAccount1.id, createdById: advisor1.id },
    { type: "CALL", subject: "Palm Villa Discussion with Elena", desc: "Reviewed beachfront elevation options and payment structures.", buyerId: bAccount2.id, createdById: advisor2.id },
    { type: "MEETING", subject: "Corporate Board Review - Apex Global", desc: "In-person briefing at DIFC office on Sky Penthouse specifications.", buyerId: bAccount3.id, createdById: advisor1.id },
  ];

  for (let i = 0; i < sampleActivities.length; i++) {
    const act = sampleActivities[i];
    await prisma.activity.create({
      data: {
        type: act.type,
        subject: act.subject,
        description: act.desc,
        leadId: act.leadId || null,
        buyerId: act.buyerId || null,
        projectId: act.projectId || null,
        unitId: act.unitId || null,
        eoiId: act.eoiId || null,
        createdById: act.createdById,
        createdAt: new Date(Date.now() - (sampleActivities.length - i) * 12 * 3600000),
      },
    });
  }

  // 10. Follow-ups
  console.log("Creating scheduled follow-ups...");
  await prisma.followUp.createMany({
    data: [
      { title: "Collect Tenancy Contract from Tariq Al Suwaidi", description: "Required to complete address verification for AML compliance.", dueDate: new Date(Date.now() + 1 * 86400000), status: "PENDING", priority: "HIGH", buyerId: bAccount1.id, assignedToId: advisor1.id },
      { title: "Follow up on SWIFT transfer copy with Elena Rostova", description: "Bank confirmation required for international wire processing.", dueDate: new Date(Date.now() + 2 * 86400000), status: "PENDING", priority: "HIGH", buyerId: bAccount2.id, assignedToId: advisor2.id },
      { title: "Call Zaid Al Nuaimi on Azure Marina 2BR units", description: "Client wanted updated floor plans for Tower West high floor.", dueDate: new Date(Date.now() + 3 * 86400000), status: "PENDING", priority: "MEDIUM", leadId: createdLeads[4].id, assignedToId: advisor1.id },
      { title: "Re-engage Oliver Brown after budget reassessment", description: "Client looking for 1BR studio entry under 1.1M AED.", dueDate: new Date(Date.now() - 1 * 86400000), status: "OVERDUE", priority: "LOW", leadId: createdLeads[14].id, assignedToId: advisor2.id },
    ],
  });

  // 11. Internal Notifications
  console.log("Generating notifications...");
  await prisma.notification.createMany({
    data: [
      { userId: advisor1.id, title: "New Qualified Lead", message: "Zaid Al Nuaimi assigned to you. Budget: 4,000,000 AED.", type: "LEAD" },
      { userId: finance.id, title: "Pending Payment Verification", message: "EOI-55001 token payment of 100,000 AED requires receipt verification.", type: "PAYMENT" },
      { userId: compliance.id, title: "New Documents for Review", message: "Buyer Tariq Al Suwaidi submitted Emirates ID and Proof of Address.", type: "DOCUMENT" },
      { userId: manager.id, title: "Purchase Order Ready for Review", message: "PO-44001 for Unit MTE-0101 submitted for executive confirmation.", type: "PO" },
      { userId: advisor2.id, title: "Follow-up Reminder", message: "Elena Rostova international buyer follow-up due in 24 hours.", type: "FOLLOW_UP" },
    ],
  });

  console.log("✅ Seed completed successfully with 100% production-quality sample records!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

