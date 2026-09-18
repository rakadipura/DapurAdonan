"use client";

import { createContext, useContext, useCallback, useReducer, ReactNode } from "react";
import type { CartItem, CustomerType, PickupWindow, DeliveryZone, Product } from "@/types";


interface SessionState {
  cart: CartItem[];
  contact: CustomerType | null;
}

type SessionAction =
  | { type: "ADD_CART"; product: Product; qty: number; notes?: string }
  | { type: "UPDATE_CART"; productId: number; qty: number }
  | { type: "REMOVE_CART"; productId: number }
  | { type: "SET_CONTACT"; contact: CustomerType | null }
  | { type: "CLEAR_CART" };

function cartReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "ADD_CART": {
      const existing = state.cart.find((c) => c.productId === action.product.id);
      if (existing) {
        return {
          ...state,
          cart: state.cart.map((c) =>
            c.productId === action.product.id
              ? { ...c, qty: c.qty + action.qty, notes: action.notes ?? c.notes }
              : c
          ),
        };
      }
      return {
        ...state,
        cart: [
          ...state.cart,
          {
            productId: action.product.id,
            name: action.product.name,
            price: action.product.price,
            imageUrl: action.product.imageUrl,
            qty: action.qty,
            notes: action.notes,
            categoryName: action.product.category?.name ?? "",
          },
        ],
      };
    }
    case "UPDATE_CART": {
      return {
        ...state,
        cart: state.cart.map((c) =>
          c.productId === action.productId
            ? { ...c, qty: Math.max(0, action.qty) }
            : c
        ).filter((c) => c.qty > 0),
      };
    }
    case "REMOVE_CART": {
      return {
        ...state,
        cart: state.cart.filter((c) => c.productId !== action.productId),
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
  addToCart: (product: Product, qty: number, notes?: string) => void;
  updateCartQty: (productId: number, qty: number) => void;
  removeFromCart: (productId: number) => void;
  setContact: (contact: CustomerType | null) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { cart: [], contact: null });

  const addToCart = useCallback(
    (product: Product, qty: number, notes?: string) => {
      dispatch({ type: "ADD_CART", product, qty, notes });
    },
    [],
  );

  const updateCartQty = useCallback(
    (productId: number, qty: number) => {
      dispatch({ type: "UPDATE_CART", productId, qty });
    },
    [],
  );

  const removeFromCart = useCallback(
    (productId: number) => {
      dispatch({ type: "REMOVE_CART", productId });
    },
    [],
  );

  const setContact = useCallback(
    (contact: CustomerType | null) => {
      dispatch({ type: "SET_CONTACT", contact });
    },
    [],
  );

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
  }, []);

  const total = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalPrice = total;
  const itemCount = state.cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <SessionContext.Provider
      value={{ state, addToCart, updateCartQty, removeFromCart, setContact, clearCart, total, itemCount }}
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
