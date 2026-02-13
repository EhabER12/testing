import axiosInstance from "@/lib/axios";
import { CartItem } from "@/store/slices/cartSlice";
import Cookies from "js-cookie";

const COOKIE_NAME = "genoun_cart_session";

// Generate or get session ID from cookies
export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";

  let sessionId = Cookies.get(COOKIE_NAME);

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    Cookies.set(COOKIE_NAME, sessionId, {
      expires: 30, // 30 days
      sameSite: "lax",
      secure: window.location.protocol === "https:",
    });
  }

  return sessionId;
}

// Clear session ID (after successful order)
export function clearSessionId(): void {
  if (typeof window === "undefined") return;
  Cookies.remove(COOKIE_NAME);
}

// Transform cart items for API
function transformCartItems(items: CartItem[]) {
  return items.map((item) => ({
    productId: item.itemType === "course" ? item.courseId || item.itemId : item.productId,
    productName:
      item.itemType === "course"
        ? item.course?.title
        : item.product?.name,
    productSlug:
      item.itemType === "course"
        ? item.course?.slug
        : item.product?.slug,
    productImage:
      item.itemType === "course"
        ? item.course?.thumbnail
        : item.product?.coverImage,
    variantId: item.itemType === "course" ? undefined : item.variantId,
    variantName: item.itemType === "course" ? undefined : item.variant?.name,
    variantPrice: item.itemType === "course" ? undefined : item.variant?.price,
    addons:
      item.itemType === "course"
        ? []
        : item.addons.map((addon) => ({
            addonId: addon.id,
            name: addon.name,
            price: addon.price,
          })),
    quantity: item.quantity,
    unitPrice:
      item.itemType === "course"
        ? Number(item.course?.price || 0)
        : item.variant?.price ?? item.product?.basePrice ?? 0,
    totalPrice:
      item.itemType === "course"
        ? Number(item.course?.price || 0) * item.quantity
        : ((item.variant?.price ?? item.product?.basePrice ?? 0) +
            item.addons.reduce((sum, a) => sum + a.price, 0)) *
          item.quantity,
  }));
}

/**
 * Create or update cart session
 */
export async function syncCartSession(
  items: CartItem[],
  total: number,
  currency = "SAR"
) {
  try {
    const sessionId = getOrCreateSessionId();
    if (!sessionId) return null;

    const response = await axiosInstance.post("/cart-sessions", {
      sessionId,
      cartItems: transformCartItems(items),
      cartTotal: total,
      currency,
    });

    return response.data;
  } catch (error) {
    console.error("Failed to sync cart session:", error);
    return null;
  }
}

/**
 * Update customer info during checkout
 */
export async function updateCustomerInfo(customerInfo: {
  name?: string;
  email?: string;
  phone?: string;
}) {
  try {
    const sessionId = getOrCreateSessionId();
    if (!sessionId) return null;

    const response = await axiosInstance.patch(
      `/cart-sessions/${sessionId}/customer`,
      customerInfo
    );

    return response.data;
  } catch (error) {
    console.error("Failed to update customer info:", error);
    return null;
  }
}

/**
 * Mark session as converted after successful payment
 */
export async function markSessionConverted(paymentId?: string) {
  try {
    const sessionId = getOrCreateSessionId();
    if (!sessionId) return null;

    const response = await axiosInstance.patch(
      `/cart-sessions/${sessionId}/converted`,
      { paymentId }
    );

    // Clear session ID after conversion
    clearSessionId();

    return response.data;
  } catch (error) {
    console.error("Failed to mark session as converted:", error);
    return null;
  }
}

// ==========================================
// ADMIN API FUNCTIONS
// ==========================================

/**
 * Get abandoned cart sessions (Admin)
 */
export async function getAbandonedSessions(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const response = await axiosInstance.get("/cart-sessions/admin/list", {
    params,
  });
  return response.data;
}

/**
 * Get single session details (Admin)
 */
export async function getSessionById(id: string) {
  const response = await axiosInstance.get(`/cart-sessions/admin/${id}`);
  return response.data;
}

/**
 * Get cart session statistics (Admin)
 */
export async function getSessionStats() {
  const response = await axiosInstance.get("/cart-sessions/admin/stats");
  return response.data;
}

/**
 * Mark session as recovered (Admin)
 */
export async function markAsRecovered(id: string, notes?: string) {
  const response = await axiosInstance.patch(
    `/cart-sessions/admin/${id}/recovered`,
    { notes }
  );
  return response.data;
}

/**
 * Add admin note to session (Admin)
 */
export async function addAdminNote(id: string, note: string) {
  const response = await axiosInstance.patch(
    `/cart-sessions/admin/${id}/note`,
    { note }
  );
  return response.data;
}

/**
 * Delete session (Admin)
 */
export async function deleteSession(id: string) {
  const response = await axiosInstance.delete(`/cart-sessions/admin/${id}`);
  return response.data;
}

/**
 * Run abandonment check manually (Admin)
 */
export async function runAbandonmentCheck(minutes = 30) {
  const response = await axiosInstance.post(
    "/cart-sessions/admin/check-abandoned",
    null,
    { params: { minutes } }
  );
  return response.data;
}
