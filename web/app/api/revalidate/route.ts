import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

// Secret token to protect the revalidation endpoint
const REVALIDATE_SECRET =
  process.env.REVALIDATE_SECRET || "genoun-revalidate-secret";

/**
 * On-Demand Revalidation API
 *
 * Usage:
 * POST /api/revalidate
 * Body: { secret: "your-secret", path: "/ar/products" }
 *
 * Or to revalidate all:
 * Body: { secret: "your-secret", all: true }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, path, all } = body;

    // Validate secret token
    if (secret !== REVALIDATE_SECRET) {
      return NextResponse.json(
        { success: false, message: "Invalid secret token" },
        { status: 401 }
      );
    }

    // Revalidate all major paths
    if (all) {
      const paths = [
        "/ar",
        "/en",
        "/ar/products",
        "/en/products",
        "/ar/services",
        "/en/services",
        "/ar/articles",
        "/en/articles",
      ];

      for (const p of paths) {
        revalidatePath(p);
      }

      return NextResponse.json({
        success: true,
        message: "All paths revalidated",
        revalidated: paths,
      });
    }

    // Revalidate specific path
    if (path) {
      revalidatePath(path);
      return NextResponse.json({
        success: true,
        message: `Path revalidated: ${path}`,
        revalidated: [path],
      });
    }

    return NextResponse.json(
      { success: false, message: "No path specified" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json(
      { success: false, message: "Revalidation failed" },
      { status: 500 }
    );
  }
}
