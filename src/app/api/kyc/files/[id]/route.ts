import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document || !document.filePath) {
      return new NextResponse("Document not found", { status: 404 });
    }

    // Check if stored as Data URL
    if (document.filePath.startsWith("data:")) {
      const parts = document.filePath.split(";base64,");
      const mimeType = parts[0].replace("data:", "") || document.mimeType || "application/octet-stream";
      const base64Content = parts[1];
      const buffer = Buffer.from(base64Content, "base64");

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `inline; filename="${document.originalName || "document"}"`,
          "Content-Length": buffer.length.toString(),
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
        },
      });
    }

    // If it's a regular URL or path, redirect to it
    return NextResponse.redirect(new URL(document.filePath, request.url));
  } catch (error) {
    console.error("Serve KYC file error:", error);
    return new NextResponse("Error serving document", { status: 500 });
  }
}

