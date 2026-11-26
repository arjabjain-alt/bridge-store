import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { formatPrice, getStatusBadgeClasses } from "@/lib/format";
import CopyEmailButton from "@/components/CopyEmailButton";

type ItemDetailPageProps = {
  params: Promise<{ id: string }>;
};

const ARTIST_EMAIL = "arjab.jain@englivo.com";

async function ItemDetailContent({ params }: ItemDetailPageProps) {
  const { id } = await params;

  const { data: item, error } = await supabase
    .from("items")
    .select("id, title, price, description, image_url, status")
    .eq("id", id)
    .single();

  if (error || !item) {
    notFound();
  }

  const isSold = (item.status ?? "").toLowerCase() === "sold";
  const formattedPrice = formatPrice(item.price);
  const subjectText = `Inquiry about "${item.title}" (ID: ${item.id})`;
  const bodyText = `Hi! I'm interested in "${item.title}" (₹${formattedPrice}) from Bridge Store.`;
  const fullInquiryText = `To: ${ARTIST_EMAIL}\nSubject: ${subjectText}\n\n${bodyText}`;

  const mailtoHref = `mailto:${encodeURIComponent(
    ARTIST_EMAIL
  )}?subject=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(
    bodyText
  )}`;

  const gmailHref = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    ARTIST_EMAIL
  )}&su=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(bodyText)}`;

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/"
        className="inline-block text-sm text-zinc-400 hover:text-zinc-100 transition mb-6"
      >
        ← Back to store
      </Link>

      <article className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 shadow-sm">
        {item.image_url ? (
          <div className="w-full overflow-hidden bg-zinc-950/60 border-b border-zinc-800 flex items-center justify-center p-3 sm:p-5">
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full max-h-[540px] object-contain rounded-lg"
            />
          </div>
        ) : (
          <div className="w-full h-72 border-b border-dashed border-zinc-800 bg-zinc-900/70 flex flex-col items-center justify-center text-zinc-400 p-6 text-center">
            <span className="text-xs uppercase tracking-widest">No Image</span>
            <span className="text-xs text-zinc-500 mt-1">
              No image uploaded for &ldquo;{item.title}&rdquo; yet
            </span>
          </div>
        )}

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400 mb-1.5">
                Artwork Details
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {item.title}
              </h1>
            </div>
            <span className="text-2xl font-bold whitespace-nowrap text-zinc-100">
              ₹{formattedPrice}
            </span>
          </div>

          <div className="mb-6">
            <span
              className={`inline-block text-[11px] font-medium uppercase tracking-wider px-2.5 py-1 border rounded-full ${getStatusBadgeClasses(
                item.status
              )}`}
            >
              {item.status || "unknown"}
            </span>
          </div>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed whitespace-pre-line mb-8">
            {item.description || "No description provided yet."}
          </p>

          {isSold ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-400">
              This piece has been marked as sold. You can still browse other
              works on the store page.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={mailtoHref}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-200 transition"
                >
                  Inquire About This Piece
                </a>

                <a
                  href={gmailHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-zinc-700 bg-zinc-900/70 text-zinc-100 text-sm font-medium hover:border-zinc-500 hover:bg-zinc-800/80 transition"
                >
                  Open in Gmail
                </a>

                <CopyEmailButton
                  email={ARTIST_EMAIL}
                  inquiryText={fullInquiryText}
                />
              </div>

              <p className="text-xs text-zinc-500">
                Direct email:{" "}
                <span className="text-zinc-400">{ARTIST_EMAIL}</span>
              </p>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}

export default function ItemDetailPage({ params }: ItemDetailPageProps) {
  return (
    <main className="min-h-screen p-6 sm:p-8 font-sans">
      <Suspense
        fallback={
          <p className="max-w-3xl mx-auto text-sm text-zinc-400">
            Loading artwork details...
          </p>
        }
      >
        <ItemDetailContent params={params} />
      </Suspense>
    </main>
  );
}