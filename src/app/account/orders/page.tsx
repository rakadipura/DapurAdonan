import type { Metadata } from "next";
import { OrderHistory } from "@/components/customer/order/OrderHistory";

export const metadata: Metadata = {
  title: "Riwayat Pesanan — Toko Mini Moni",
};

export default function AccountOrdersPage() {
  return <OrderHistory />;
}