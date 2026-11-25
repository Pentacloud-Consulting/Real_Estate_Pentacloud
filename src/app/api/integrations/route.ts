import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// Initial default integrations state - all set to disconnected so all show "Connect Now"
let integrationsState: Record<string, {
  connected: boolean;
  lastSync: string;
  syncedLeadsCount: number;
  config: Record<string, any>;
}> = {
  meta: {
    connected: false,
    lastSync: "Never",
    syncedLeadsCount: 0,
    config: {
      pageId: "",
      adAccountId: "",
      leadFormName: "",
      status: "DISCONNECTED",
    },
  },
  instagram: {
    connected: false,
    lastSync: "Never",
    syncedLeadsCount: 0,
    config: {
      accountHandle: "",
      adSyncEnabled: false,
      dmAutoCapture: false,
      status: "DISCONNECTED",
    },
  },
  tiktok: {
    connected: false,
    lastSync: "Never",
    syncedLeadsCount: 0,
    config: {
      advertiserId: "",
      appId: "",
      status: "DISCONNECTED",
    },
  },
  dubizzle: {
    connected: false,
    lastSync: "Never",
    syncedLeadsCount: 0,
    config: {
      agencyId: "",
      feedFormat: "XML_V3",
      autoSyncListings: false,
      status: "DISCONNECTED",
    },
  },
  propertyfinder: {
    connected: false,
    lastSync: "Never",
    syncedLeadsCount: 0,
    config: {
      brokerRef: "",
      myCrmApiEnabled: false,
      webhookVerified: false,
      status: "DISCONNECTED",
    },
  },
  bayut: {
    connected: false,
    lastSync: "Never",
    syncedLeadsCount: 0,
    config: {
      companyId: "",
      profolioSync: false,
      truCheckEnabled: false,
      status: "DISCONNECTED",
    },
  },
};

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    return NextResponse.json({ integrations: integrationsState });
  } catch (error) {
    console.error("Fetch integrations error:", error);
    return NextResponse.json({ error: "Failed to fetch integrations" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { channel, connected, config } = body;

    if (!channel || !integrationsState[channel]) {
      return NextResponse.json({ error: "Invalid integration channel" }, { status: 400 });
    }

    integrationsState[channel] = {
      ...integrationsState[channel],
      connected: connected !== undefined ? connected : integrationsState[channel].connected,
      lastSync: connected ? "Just now" : integrationsState[channel].lastSync,
      syncedLeadsCount: connected ? (integrationsState[channel].syncedLeadsCount || 1) : integrationsState[channel].syncedLeadsCount,
      config: {
        ...integrationsState[channel].config,
        ...(config || {}),
        status: connected ? "ACTIVE" : "DISCONNECTED",
      },
    };

    return NextResponse.json({
      success: true,
      channel,
      integration: integrationsState[channel],
    });
  } catch (error: any) {
    console.error("Update integration error:", error);
    return NextResponse.json({ error: error.message || "Failed to update integration" }, { status: 500 });
  }
}
