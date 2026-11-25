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

let listingsStore: PropertyListing[] = [
  {
    id: "lst-1",
    reference: "LST-84920",
    title: "Signature Sky Penthouse with Direct Burj Khalifa & Fountain Views",
    listingType: "OFF_PLAN",
    propertyType: "PENTHOUSE",
    projectName: "Downtown Heights Tower",
    unitNumber: "DHT-PH-02",
    location: "Downtown Dubai",
    city: "Dubai",
    bedrooms: 4,
    bathrooms: 5,
    area: 5850,
    askingPrice: 10450000,
    pricePerSqFt: 1786,
    trakheesiPermit: "7192840192",
    status: "ACTIVE",
    portals: {
      propertyFinder: true,
      bayut: true,
      dubizzle: true,
      website: true,
    },
    inquiriesCount: 28,
    viewsCount: 1420,
    daysOnMarket: 14,
    heroImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    features: ["Private Infinity Pool", "Burj Khalifa Panorama", "Smart Home Automation", "Private Elevator Access", "3 Designated Parking"],
    description: "Exceptional duplex penthouse crowning Downtown Heights Tower. Floor-to-ceiling double-height glass framing unprecedented views of Burj Khalifa and the Dubai Fountains. Finished with Italian Calacatta marble and bespoke Poliform cabinetry.",
    agentName: "Ahmed Al Rashid",
    agentPhone: "+971 50 100 2000",
    createdAt: "2026-11-10",
  },
  {
    id: "lst-2",
    reference: "LST-84921",
    title: "Ultra-Prime Beachfront Mansion with Private Beach & Yacht Mooring",
    listingType: "OFF_PLAN",
    propertyType: "VILLA",
    projectName: "Palm Vista Mansions",
    unitNumber: "PVN-V-03",
    location: "Palm Jumeirah",
    city: "Dubai",
    bedrooms: 6,
    bathrooms: 7,
    area: 9200,
    askingPrice: 24500000,
    pricePerSqFt: 2663,
    trakheesiPermit: "7184920184",
    status: "ACTIVE",
    portals: {
      propertyFinder: true,
      bayut: true,
      dubizzle: false,
      website: true,
    },
    inquiriesCount: 42,
    viewsCount: 2890,
    daysOnMarket: 21,
    heroImage: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
    features: ["Private White Sand Beach", "Lap Pool & Jacuzzi", "Staff Quarters", "Rooftop Sunset Lounge", "Sub-Zero Gourmet Kitchen"],
    description: "A masterwork of coastal architecture situated on the coveted fronds of Palm Jumeirah. Enjoy absolute privacy, crystalline waters, and direct yacht access.",
    agentName: "Ahmed Al Rashid",
    agentPhone: "+971 50 100 2000",
    createdAt: "2026-11-04",
  },
  {
    id: "lst-3",
    reference: "LST-84922",
    title: "Luxury Waterfront Marina Residence overlooking Yacht Club",
    listingType: "SECONDARY",
    propertyType: "APARTMENT",
    projectName: "Azure Marina Residences",
    unitNumber: "AMR-1104",
    location: "Dubai Marina",
    city: "Dubai",
    bedrooms: 2,
    bathrooms: 3,
    area: 1680,
    askingPrice: 1950000,
    pricePerSqFt: 1160,
    trakheesiPermit: "7102938471",
    status: "ACTIVE",
    portals: {
      propertyFinder: true,
      bayut: true,
      dubizzle: true,
      website: true,
    },
    inquiriesCount: 65,
    viewsCount: 3100,
    daysOnMarket: 9,
    heroImage: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
    features: ["Full Marina Canal View", "Direct Tram Access", "Modern Open-Plan Living", "High Rental Yields 8.2% NET"],
    description: "Immaculate high-floor corner residence in Azure Marina. Large wraparound balcony offering continuous views of superyachts navigating Dubai Marina canal.",
    agentName: "Ahmed Al Rashid",
    agentPhone: "+971 50 100 2000",
    createdAt: "2026-11-16",
  },
  {
    id: "lst-4",
    reference: "LST-84923",
    title: "Modern Contemporary Townhouse in Gated Luxury Golf Community",
    listingType: "OFF_PLAN",
    propertyType: "TOWNHOUSE",
    projectName: "Downtown Heights Tower",
    unitNumber: "DHT-TH-01",
    location: "Dubai Hills Estate",
    city: "Dubai",
    bedrooms: 3,
    bathrooms: 4,
    area: 2850,
    askingPrice: 3850000,
    pricePerSqFt: 1350,
    trakheesiPermit: "7193049182",
    status: "UNDER_OFFER",
    portals: {
      propertyFinder: true,
      bayut: false,
      dubizzle: true,
      website: true,
    },
    inquiriesCount: 39,
    viewsCount: 1850,
    daysOnMarket: 30,
    heroImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    features: ["Private Garden", "Golf Course Proximity", "Maid's Room Ensuite", "Covered 2-Car Garage"],
    description: "Chic modern townhouse with manicured private lawn, double-height ceiling voids, and sun-drenched minimalist interiors in prime golf estate.",
    agentName: "Ahmed Al Rashid",
    agentPhone: "+971 50 100 2000",
    createdAt: "2026-10-25",
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
      projectName: body.projectName || "Development Project",
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
      heroImage: body.heroImage || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
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

