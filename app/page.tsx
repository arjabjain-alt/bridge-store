import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import StoreCatalog, { type StoreItem } from "@/components/StoreCatalog";

async function StoreItems() {
  const { data: items, error } = await supabase
    .from("items")
    .select("id, title, price, description, image_url, status")
    .order("id", { ascending: true });

  if (error) {
    return (
      <p className="text-red-500">Could not load items: {error.message}</p>
    );
  }

  if (!items || items.length === 0) {
    return <p>No items found in Supabase yet.</p>;
  }

  return <StoreCatalog items={items as StoreItem[]} />;
}

export default function HomePage() {
  return (
    <main className="min-h-screen p-8 font-sans max-w-4xl mx-auto">
      <header className="mb-8 border-b border-zinc-800 pb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400 mb-2">
          Original Works &amp; Editions
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Bridge Store
        </h1>
        <p className="text-sm text-zinc-400 mt-2 max-w-xl">
          Browse available pieces, filter by status, or click any work for full details and inquiries.
        </p>
      </header>
      <Suspense fallback={<p>Loading items...</p>}>
        <StoreItems />
      </Suspense>
    </main>
  );
}