import { revalidatePath, revalidateTag } from "next/cache";
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
    const { secret, path, all, tag } = body;

    // Validate secret token
    if (secret !== REVALIDATE_SECRET) {
      return NextResponse.json(
        { success: false, message: "Invalid secret token" },
        { status: 401 }
      );
    }

    // Revalidate by tag (most efficient)
    if (tag) {
      console.log(`🔄 Revalidating tag: ${tag}`);
      revalidateTag(tag);
      return NextResponse.json({
        success: true,
        message: `Tag revalidated: ${tag}`,
        timestamp: new Date().toISOString(),
      });
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
        "/ar/courses",
        "/en/courses",
      ];

      console.log('🔄 Revalidating all paths:', paths);
      
      // Also revalidate settings tag
      try {
        revalidateTag('settings');
        console.log('✅ Revalidated settings tag');
      } catch (err) {
        console.error('❌ Failed to revalidate settings tag:', err);
      }
      
      for (const p of paths) {
        try {
          revalidatePath(p, 'page');
          console.log(`✅ Revalidated: ${p}`);
        } catch (err) {
          console.error(`❌ Failed to revalidate ${p}:`, err);
        }
      }

      return NextResponse.json({
        success: true,
        message: "All paths revalidated",
        revalidated: paths,
        timestamp: new Date().toISOString(),
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
