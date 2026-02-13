import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Product, ProductVariant, ProductAddon } from "./productSlice";

export interface CartCourse {
  id: string;
  _id?: string;
  title: { ar: string; en: string };
  slug: string;
  shortDescription?: { ar: string; en: string };
  thumbnail?: string;
  accessType: "free" | "paid" | "byPackage";
  price?: number;
  currency?: "SAR" | "EGP" | "USD";
}

// Cart Item Interface
export interface CartItem {
  itemType: "product" | "course";
  itemId: string;
  productId: string;
  product?: Product;
  courseId?: string;
  course?: CartCourse;
  variantId?: string;
  variant?: ProductVariant;
  addonIds: string[];
  addons: ProductAddon[];
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  isInitialized: boolean;
}

// Helper to calculate item price
export function calculateItemPrice(item: CartItem): number {
  if (item.itemType === "course") {
    const coursePrice = Number(item.course?.price || 0);
    return coursePrice * item.quantity;
  }

  const basePrice = item.variant?.price ?? item.product?.basePrice ?? 0;
  const addonsTotal = item.addons.reduce((sum, addon) => sum + addon.price, 0);
  return (basePrice + addonsTotal) * item.quantity;
}

// Helper to calculate cart total
export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + calculateItemPrice(item), 0);
}

// Helper to get cart item count
export function getCartItemCount(items: CartItem[]): number {
  return items.reduce((count, item) => count + item.quantity, 0);
}

// LocalStorage key
const CART_STORAGE_KEY = "genoun_cart";

// Load cart from localStorage
function loadCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save cart to localStorage
function saveCartToStorage(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage errors
  }
}

const initialState: CartState = {
  items: [],
  isOpen: false,
  isInitialized: false,
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // Initialize cart from localStorage
    initializeCart: (state) => {
      const storedItems = loadCartFromStorage();
      state.items = storedItems.map((item: any) => {
        const inferredType =
          item.itemType || (item.course || item.courseId ? "course" : "product");
        const inferredId =
          item.itemId ||
          item.courseId ||
          item.productId ||
          item.product?.id ||
          item.product?._id ||
          item.course?.id ||
          item.course?._id ||
          "";

        return {
          itemType: inferredType,
          itemId: inferredId,
          productId: item.productId || inferredId,
          product: item.product,
          courseId: item.courseId,
          course: item.course,
          variantId: item.variantId,
          variant: item.variant,
          addonIds: Array.isArray(item.addonIds) ? item.addonIds : [],
          addons: Array.isArray(item.addons) ? item.addons : [],
          quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
        } as CartItem;
      });
      state.isInitialized = true;
    },

    // Add item to cart
    addToCart: (
      state,
      action: PayloadAction<{
        product: Product;
        variant?: ProductVariant;
        addons?: ProductAddon[];
        quantity?: number;
      }>
    ) => {
      const { product, variant, addons = [], quantity = 1 } = action.payload;
      const productId = product.id || (product as any)._id;

      // Check if same product+variant+addons exists
      const existingIndex = state.items.findIndex(
        (item) =>
          item.itemType === "product" &&
          item.productId === productId &&
          item.variantId === variant?.id &&
          JSON.stringify(item.addonIds.sort()) ===
            JSON.stringify(addons.map((a) => a.id).sort())
      );

      if (existingIndex >= 0) {
        // Increment quantity
        state.items[existingIndex].quantity += quantity;
      } else {
        // Add new item
        state.items.push({
          itemType: "product",
          itemId: productId,
          productId: productId,
          product,
          courseId: undefined,
          course: undefined,
          variantId: variant?.id,
          variant,
          addonIds: addons.map((a) => a.id),
          addons,
          quantity,
        });
      }

      saveCartToStorage(state.items);
    },

    // Add paid course to cart
    addCourseToCart: (
      state,
      action: PayloadAction<{
        course: CartCourse;
        quantity?: number;
      }>
    ) => {
      const { course, quantity = 1 } = action.payload;
      const courseId = course.id || course._id;
      if (!courseId) return;

      const existingIndex = state.items.findIndex(
        (item) => item.itemType === "course" && item.courseId === courseId
      );

      if (existingIndex >= 0) {
        state.items[existingIndex].quantity += quantity;
      } else {
        state.items.push({
          itemType: "course",
          itemId: courseId,
          productId: courseId, // Kept for backwards compatibility in some consumers
          product: undefined,
          courseId,
          course,
          variantId: undefined,
          variant: undefined,
          addonIds: [],
          addons: [],
          quantity,
        });
      }

      saveCartToStorage(state.items);
    },

    // Update item quantity
    updateQuantity: (
      state,
      action: PayloadAction<{ index: number; quantity: number }>
    ) => {
      const { index, quantity } = action.payload;
      if (index >= 0 && index < state.items.length) {
        if (quantity <= 0) {
          state.items.splice(index, 1);
        } else {
          state.items[index].quantity = quantity;
        }
        saveCartToStorage(state.items);
      }
    },

    // Remove item from cart
    removeFromCart: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      if (index >= 0 && index < state.items.length) {
        state.items.splice(index, 1);
        saveCartToStorage(state.items);
      }
    },

    // Clear entire cart
    clearCart: (state) => {
      state.items = [];
      saveCartToStorage(state.items);
    },

    // Toggle cart drawer
    openCart: (state) => {
      state.isOpen = true;
    },

    closeCart: (state) => {
      state.isOpen = false;
    },

    toggleCart: (state) => {
      state.isOpen = !state.isOpen;
    },
  },
});

export const {
  initializeCart,
  addToCart,
  addCourseToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  openCart,
  closeCart,
  toggleCart,
} = cartSlice.actions;

export default cartSlice.reducer;
