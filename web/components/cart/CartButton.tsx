"use client";

import { useEffect } from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  initializeCart,
  openCart,
  getCartItemCount,
} from "@/store/slices/cartSlice";

export function CartButton() {
  const dispatch = useAppDispatch();
  const { items } = useAppSelector((state) => state.cart);

  // Initialize cart from localStorage
  useEffect(() => {
    dispatch(initializeCart());
  }, [dispatch]);

  const itemCount = getCartItemCount(items);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={() => dispatch(openCart())}
    >
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Button>
  );
}
