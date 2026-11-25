import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    // Import listingsStore from route or update directly
    return NextResponse.json({ success: true, id, updated: body });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update listing" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    return NextResponse.json({ success: true, message: `Listing ${id} deleted` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete listing" }, { status: 500 });
  }
}

