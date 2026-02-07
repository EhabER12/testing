"use server";

import { revalidateTag, revalidatePath } from "next/cache";

/**
 * Revalidate settings cache after updates
 * Called from dashboard settings page after successful save
 */
export async function revalidateSettings() {
  try {
    // Revalidate the settings cache tag
    revalidateTag("settings");
    
    // Also revalidate common paths that use settings
    revalidatePath("/", "layout");
    revalidatePath("/ar", "layout");
    revalidatePath("/en", "layout");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to revalidate settings:", error);
    return { success: false, error: String(error) };
  }
}
