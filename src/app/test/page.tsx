import type { Metadata } from "next";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Test Orders",
};

export default async function TestPage() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ["CONFIRMED", "BAKING", "READY", "COMPLETED"] },
        createdAt: { gte: todayStart },
      },
      include: {
        itemsOrder: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Test Orders Works!</h1>
        <p>Orders count: {orders.length}</p>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-8 text-red-600">
        <h1 className="text-2xl font-bold">Orders Error</h1>
        <pre>{error instanceof Error ? error.message : String(error)}</pre>
      </div>
    );
  }
}