import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Product, ProductVariant, ProductAddon } from "./productSlice";

// Cart Item Interface
export interface CartItem {
  productId: string;
  product: Product;
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
  const basePrice = item.variant?.price ?? item.product.basePrice;
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
      state.items = loadCartFromStorage();
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

      // Check if same product+variant+addons exists
      const existingIndex = state.items.findIndex(
        (item) =>
          item.productId === product.id &&
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
          productId: product.id,
          product,
          variantId: variant?.id,
          variant,
          addonIds: addons.map((a) => a.id),
          addons,
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
  updateQuantity,
  removeFromCart,
  clearCart,
  openCart,
  closeCart,
  toggleCart,
} = cartSlice.actions;

export default cartSlice.reducer;
