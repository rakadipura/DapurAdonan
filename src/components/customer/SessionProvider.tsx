"use client";

import { createContext, useContext, useCallback, useReducer, ReactNode } from "react";
import type { CartItem, CustomerType } from "@/types";

interface SessionState {
  cart: CartItem[];
  contact: CustomerType | null;
}

type SessionAction =
  | { type: "ADD_CART"; item: CartItem }
  | { type: "UPDATE_CART"; cartKey: string; qty: number }
  | { type: "REMOVE_CART"; cartKey: string }
  | { type: "SET_CONTACT"; contact: CustomerType | null }
  | { type: "CLEAR_CART" };

function getCartKey(item: CartItem): string {
  const variantKey = item.variantId ?? "none";
  const addOnsKey = item.selectedAddOns?.sort().join(",") ?? "";
  return `${item.productId}-${variantKey}-${addOnsKey}`;
}

function cartReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "ADD_CART": {
      const newItem = action.item;
      const newKey = getCartKey(newItem);
      const existingIndex = state.cart.findIndex((c) => getCartKey(c) === newKey);
      if (existingIndex >= 0) {
        return {
          ...state,
          cart: state.cart.map((c, i) =>
            i === existingIndex
              ? { ...c, qty: c.qty + newItem.qty, notes: newItem.notes ?? c.notes }
              : c
          ),
        };
      }
      return {
        ...state,
        cart: [...state.cart, newItem],
      };
    }
    case "UPDATE_CART": {
      return {
        ...state,
        cart: state.cart
          .map((c) => (getCartKey(c) === action.cartKey ? { ...c, qty: Math.max(0, action.qty) } : c))
          .filter((c) => c.qty > 0),
      };
    }
    case "REMOVE_CART": {
      return {
        ...state,
        cart: state.cart.filter((c) => getCartKey(c) !== action.cartKey),
      };
    }
    case "SET_CONTACT": {
      return { ...state, contact: action.contact };
    }
    case "CLEAR_CART": {
      return { ...state, cart: [] };
    }
    default:
      return state;
  }
}

interface SessionContextValue {
  state: SessionState;
  addToCart: (item: CartItem) => void;
  updateCartQty: (cartKey: string, qty: number) => void;
  removeFromCart: (cartKey: string) => void;
  setContact: (contact: CustomerType | null) => void;
  clearCart: () => void;
  totalAmount: number;
  itemCount: number;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { cart: [], contact: null });

  const addToCart = useCallback((item: CartItem) => {
    dispatch({ type: "ADD_CART", item });
  }, []);

  const updateCartQty = useCallback((cartKey: string, qty: number) => {
    dispatch({ type: "UPDATE_CART", cartKey, qty });
  }, []);

  const removeFromCart = useCallback((cartKey: string) => {
    dispatch({ type: "REMOVE_CART", cartKey });
  }, []);

  const setContact = useCallback((contact: CustomerType | null) => {
    dispatch({ type: "SET_CONTACT", contact });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
  }, []);

  const totalAmount = state.cart.reduce((sum, item) => sum + (item.price + (item.addOnsPrice || 0)) * item.qty, 0);
  const itemCount = state.cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <SessionContext.Provider
      value={{ state, addToCart, updateCartQty, removeFromCart, setContact, clearCart, totalAmount, itemCount }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}