import type { Metadata } from "next";
import { getCustomerFacingSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Test Settings",
};

export default async function TestPage() {
  try {
    const settings = await getCustomerFacingSettings();
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Test Settings Works!</h1>
        <pre className="mt-4 p-4 bg-gray-100 rounded text-sm overflow-auto">
          {JSON.stringify(settings, null, 2)}
        </pre>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-8 text-red-600">
        <h1 className="text-2xl font-bold">Settings Error</h1>
        <pre>{error instanceof Error ? error.message : String(error)}</pre>
      </div>
    );
  }
}