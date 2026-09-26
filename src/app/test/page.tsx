import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Test Page",
};

export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Test Page Works!</h1>
      <p>If you see this, the basic Next.js routing works.</p>
    </div>
  );
}