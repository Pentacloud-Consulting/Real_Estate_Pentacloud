import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export interface PropertyListing {
  id: string;
  reference: string;
  title: string;
  listingType: "OFF_PLAN" | "SECONDARY" | "RENTAL";
  propertyType: "PENTHOUSE" | "VILLA" | "APARTMENT" | "TOWNHOUSE";
  projectName: string;
  unitNumber: string;
  location: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  askingPrice: number;
  pricePerSqFt: number;
  trakheesiPermit: string;
  status: "ACTIVE" | "DRAFT" | "UNDER_OFFER" | "ARCHIVED";
  portals: {
    propertyFinder: boolean;
    bayut: boolean;
    dubizzle: boolean;
    website: boolean;
  };
  inquiriesCount: number;
  viewsCount: number;
  daysOnMarket: number;
  heroImage: string;
  features: string[];
  description: string;
  agentName: string;
  agentPhone: string;
  createdAt: string;
}

const DOWNTOWN_IMAGE = "/images/projects/downtown-crown.jpg";
const PALM_IMAGE = "/images/projects/palm-villas.jpg";

let listingsStore: PropertyListing[] = [
  {
    id: "lst-1",
    reference: "LST-90101",
    title: "Signature Sky Penthouse with Direct Burj Khalifa & Fountain Views",
    listingType: "OFF_PLAN",
    propertyType: "PENTHOUSE",
    projectName: "Downtown Crown Residences",
    unitNumber: "DCR-PH-01",
    location: "Downtown Dubai",
    city: "Dubai",
    bedrooms: 4,
    bathrooms: 5,
    area: 5400,
    askingPrice: 9800000,
    pricePerSqFt: 1815,
    trakheesiPermit: "7192840192",
    status: "ACTIVE",
    portals: {
      propertyFinder: true,
      bayut: true,
      dubizzle: true,
      website: true,
    },
    inquiriesCount: 34,
    viewsCount: 1680,
    daysOnMarket: 8,
    heroImage: DOWNTOWN_IMAGE,
    features: ["Burj Khalifa Views", "Private Infinity Pool", "Smart Home Tech", "Direct Mall Access", "Helipad Access"],
    description: "Exceptional duplex penthouse crowning Downtown Crown Residences. Floor-to-ceiling glass framing unprecedented views of Burj Khalifa and the Dubai Fountains. Finished with Italian Calacatta marble and bespoke Poliform cabinetry.",
    agentName: "Ahmed Al Rashid",
    agentPhone: "+971 50 100 2000",
    createdAt: "2026-11-18",
  },
  {
    id: "lst-2",
    reference: "LST-90102",
    title: "Luxury 2BR Residence with Full Burj Khalifa Panorama",
    listingType: "OFF_PLAN",
    propertyType: "APARTMENT",
    projectName: "Downtown Crown Residences",
    unitNumber: "DCR-0102",
    location: "Downtown Dubai",
    city: "Dubai",
    bedrooms: 2,
    bathrooms: 3,
    area: 1450,
    askingPrice: 2750000,
    pricePerSqFt: 1896,
    trakheesiPermit: "7184920199",
    status: "ACTIVE",
    portals: {
      propertyFinder: true,
      bayut: true,
      dubizzle: true,
      website: true,
    },
    inquiriesCount: 52,
    viewsCount: 2450,
    daysOnMarket: 12,
    heroImage: DOWNTOWN_IMAGE,
    features: ["Burj Panorama", "Valet Parking", "Concierge Service", "High Rental Yield 8.5%"],
    description: "Ultra-luxury modern 2-bedroom executive apartment with sun-drenched balconies directly facing Downtown Dubai skyline.",
    agentName: "Ahmed Al Rashid",
    agentPhone: "+971 50 100 2000",
    createdAt: "2026-11-15",
  },
  {
    id: "lst-3",
    reference: "LST-90201",
    title: "Ultra-Prime Beachfront Mansion with Private Beach & Yacht Mooring",
    listingType: "OFF_PLAN",
    propertyType: "VILLA",
    projectName: "Palm Island Beachfront Villas",
    unitNumber: "PIV-V01",
    location: "Palm Jumeirah",
    city: "Dubai",
    bedrooms: 4,
    bathrooms: 5,
    area: 6200,
    askingPrice: 16500000,
    pricePerSqFt: 2661,
    trakheesiPermit: "7184920184",
    status: "ACTIVE",
    portals: {
      propertyFinder: true,
      bayut: true,
      dubizzle: true,
      website: true,
    },
    inquiriesCount: 46,
    viewsCount: 3120,
    daysOnMarket: 14,
    heroImage: PALM_IMAGE,
    features: ["Private White Sand Beach", "Lap Pool & Jacuzzi", "Staff Quarters", "Rooftop Sunset Lounge", "Sub-Zero Gourmet Kitchen"],
    description: "A masterwork of coastal architecture situated on the coveted fronds of Palm Jumeirah. Enjoy absolute privacy, crystalline waters, and direct yacht access.",
    agentName: "Ahmed Al Rashid",
    agentPhone: "+971 50 100 2000",
    createdAt: "2026-11-11",
  },
  {
    id: "lst-4",
    reference: "LST-90204",
    title: "Royal Imperial Beachfront Villa with Private Lagoon Access",
    listingType: "OFF_PLAN",
    propertyType: "VILLA",
    projectName: "Palm Island Beachfront Villas",
    unitNumber: "PIV-V04",
    location: "Palm Jumeirah",
    city: "Dubai",
    bedrooms: 6,
    bathrooms: 7,
    area: 9900,
    askingPrice: 28000000,
    pricePerSqFt: 2828,
    trakheesiPermit: "7193049182",
    status: "ACTIVE",
    portals: {
      propertyFinder: true,
      bayut: true,
      dubizzle: false,
      website: true,
    },
    inquiriesCount: 29,
    viewsCount: 1980,
    daysOnMarket: 22,
    heroImage: PALM_IMAGE,
    features: ["Direct Ocean Access", "Infinity Pool", "Private Cinema", "Elevator", "6-Car Underground Garage"],
    description: "Palatial 6-bedroom signature estate spanning nearly 10,000 sq. ft. on Palm Jumeirah with direct access to private tranquil waters.",
    agentName: "Ahmed Al Rashid",
    agentPhone: "+971 50 100 2000",
    createdAt: "2026-11-03",
  },
];

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").toLowerCase();
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";

    let filtered = [...listingsStore];
    if (search) {
      filtered = filtered.filter(
        (l) =>
          l.title.toLowerCase().includes(search) ||
          l.reference.toLowerCase().includes(search) ||
          l.location.toLowerCase().includes(search) ||
          l.unitNumber.toLowerCase().includes(search)
      );
    }
    if (type) filtered = filtered.filter((l) => l.listingType === type);
    if (status) filtered = filtered.filter((l) => l.status === status);

    return NextResponse.json({ listings: filtered, total: filtered.length });
  } catch (error) {
    console.error("Fetch listings error:", error);
    return NextResponse.json({ error: "Failed to fetch property listings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    if (!body.title || !body.askingPrice) {
      return NextResponse.json({ error: "Title and Asking Price are required" }, { status: 400 });
    }

    const area = Number(body.area) || 1200;
    const askingPrice = Number(body.askingPrice);
    const pricePerSqFt = Math.round(askingPrice / area);

    const newListing: PropertyListing = {
      id: `lst-${Date.now()}`,
      reference: body.reference || `LST-${Math.floor(10000 + Math.random() * 90000)}`,
      title: body.title.trim(),
      listingType: body.listingType || "OFF_PLAN",
      propertyType: body.propertyType || "APARTMENT",
      projectName: body.projectName || "Downtown Crown Residences",
      unitNumber: body.unitNumber || "TBD",
      location: body.location || "Dubai",
      city: body.city || "Dubai",
      bedrooms: Number(body.bedrooms) || 1,
      bathrooms: Number(body.bathrooms) || 1,
      area,
      askingPrice,
      pricePerSqFt,
      trakheesiPermit: body.trakheesiPermit || `71${Math.floor(10000000 + Math.random() * 90000000)}`,
      status: body.status || "ACTIVE",
      portals: {
        propertyFinder: body.portals?.propertyFinder ?? true,
        bayut: body.portals?.bayut ?? true,
        dubizzle: body.portals?.dubizzle ?? true,
        website: body.portals?.website ?? true,
      },
      inquiriesCount: 0,
      viewsCount: 0,
      daysOnMarket: 1,
      heroImage: body.heroImage || DOWNTOWN_IMAGE,
      features: body.features && Array.isArray(body.features) ? body.features : ["Balcony", "Parking", "Concierge"],
      description: body.description || "",
      agentName: user.firstName ? `${user.firstName} ${user.lastName || ""}` : "Ahmed Al Rashid",
      agentPhone: "+971 50 100 2000",
      createdAt: new Date().toISOString().split("T")[0],
    };

    listingsStore.unshift(newListing);
    return NextResponse.json({ listing: newListing }, { status: 201 });
  } catch (error: any) {
    console.error("Create listing error:", error);
    return NextResponse.json({ error: error.message || "Failed to create listing" }, { status: 500 });
  }
}
