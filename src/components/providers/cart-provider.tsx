"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { CART_STORAGE_KEY, type CartItem } from "@/lib/cart";

type AddCartItemInput = Omit<CartItem, "quantity"> & {
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  addItem: (item: AddCartItemInput) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        setItems(JSON.parse(savedCart) as CartItem[]);
      }
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce(
      (sum, item) => sum + (item.price ?? 0) * item.quantity,
      0,
    );

    return {
      items,
      totalItems,
      totalAmount,
      addItem: (item) => {
        setItems((currentItems) => {
          const existingItem = currentItems.find((currentItem) => currentItem.id === item.id);

          if (existingItem) {
            return currentItems.map((currentItem) =>
              currentItem.id === item.id
                ? {
                    ...currentItem,
                    quantity: Math.min(
                      currentItem.quantity + item.quantity,
                      Math.max(item.stockQuantity, 1),
                    ),
                  }
                : currentItem,
            );
          }

          return [
            ...currentItems,
            {
              ...item,
              quantity: Math.min(item.quantity, Math.max(item.stockQuantity, 1)),
            },
          ];
        });
      },
      updateQuantity: (id, quantity) => {
        setItems((currentItems) =>
          currentItems.flatMap((item) => {
            if (item.id !== id) {
              return item;
            }

            if (quantity <= 0) {
              return [];
            }

            return {
              ...item,
              quantity: Math.min(quantity, Math.max(item.stockQuantity, 1)),
            };
          }),
        );
      },
      removeItem: (id) => {
        setItems((currentItems) => currentItems.filter((item) => item.id !== id));
      },
      clearCart: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
