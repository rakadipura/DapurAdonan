import type { Metadata } from "next";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Test Page with DB",
};

export default async function TestPage() {
  try {
    const count = await prisma.category.count();
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Test Page with DB Works!</h1>
        <p>Categories count: {count}</p>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-8 text-red-600">
        <h1 className="text-2xl font-bold">DB Error</h1>
        <pre>{error instanceof Error ? error.message : String(error)}</pre>
      </div>
    );
  }
}