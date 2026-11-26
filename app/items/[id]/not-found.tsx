import Link from "next/link";

export default function ItemNotFound() {
  return (
    <main className="min-h-screen p-6 sm:p-8 font-sans flex items-center justify-center">
      <div className="max-w-md w-full rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400 mb-2">
          Not Found
        </p>
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          Artwork Not Available
        </h1>
        <p className="text-sm text-zinc-400 mb-6">
          This item link may be broken or the piece may have been removed from the catalog.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-200 transition"
        >
          Back to Bridge Store
        </Link>
      </div>
    </main>
  );
}