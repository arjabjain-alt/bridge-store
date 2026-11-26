"use client";

import Link from "next/link";
import { useState } from "react";
import {
  formatPrice,
  getStatusBadgeClasses,
  parseNumericPrice,
} from "@/lib/format";

export type StoreItem = {
  id: string | number;
  title: string;
  price: number | string;
  description: string | null;
  image_url: string | null;
  status: string | null;
};

type SortOption = "default" | "newest" | "price-asc" | "price-desc";

function compareNewest(a: StoreItem, b: StoreItem): number {
  const numA = Number(a.id);
  const numB = Number(b.id);
  if (!Number.isNaN(numA) && !Number.isNaN(numB) && numA !== numB) {
    return numB - numA;
  }
  return String(b.id).localeCompare(String(a.id), undefined, {
    numeric: true,
  });
}

export default function StoreCatalog({ items }: { items: StoreItem[] }) {
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "available" | "sold"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("default");

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const availableCount = items.filter(
    (item) => (item.status ?? "").toLowerCase() === "available"
  ).length;
  const soldCount = items.filter(
    (item) => (item.status ?? "").toLowerCase() === "sold"
  ).length;

  const filteredItems = items
    .filter((item) => {
      const normalizedStatus = (item.status ?? "").toLowerCase();
      const matchesStatus =
        selectedFilter === "all" ? true : normalizedStatus === selectedFilter;

      if (!matchesStatus) return false;
      if (!normalizedQuery) return true;

      const titleMatch = (item.title ?? "")
        .toLowerCase()
        .includes(normalizedQuery);
      const descriptionMatch = (item.description ?? "")
        .toLowerCase()
        .includes(normalizedQuery);

      return titleMatch || descriptionMatch;
    })
    .sort((a, b) => {
      if (sortBy === "default") return 0;
      if (sortBy === "newest") return compareNewest(a, b);

      const priceA = parseNumericPrice(a.price);
      const priceB = parseNumericPrice(b.price);

      if (priceA === null && priceB === null) return 0;
      if (priceA === null) return 1;
      if (priceB === null) return -1;

      return sortBy === "price-asc" ? priceA - priceB : priceB - priceA;
    });

  const filters: {
    key: "all" | "available" | "sold";
    label: string;
    count: number;
  }[] = [
    { key: "all", label: "All", count: items.length },
    { key: "available", label: "Available", count: availableCount },
    { key: "sold", label: "Sold", count: soldCount },
  ];

  const isFiltered =
    selectedFilter !== "all" || Boolean(normalizedQuery) || sortBy !== "default";
  const countLabel = `${filteredItems.length} ${
    filteredItems.length === 1 ? "item" : "items"
  }`;

  function resetAllControls() {
    setSelectedFilter("all");
    setSearchQuery("");
    setSortBy("default");
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          {filters.map((tab) => {
            const isActive = selectedFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedFilter(tab.key)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition ${
                  isActive
                    ? "bg-white text-black border-white"
                    : "bg-transparent text-inherit border-zinc-800 hover:border-zinc-600"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
          <div className="relative w-full sm:w-60">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title or description..."
              aria-label="Search items by title or description"
              className="w-full px-3.5 py-2 rounded-lg text-sm border border-zinc-800 bg-zinc-900/60 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            aria-label="Sort items"
            className="px-3 py-2 rounded-lg text-sm border border-zinc-800 bg-zinc-900/60 text-zinc-200 focus:outline-none focus:border-zinc-500"
          >
            <option value="default">Sort: Featured</option>
            <option value="newest">Newest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-400 mb-6">
        <p>
          Showing <span className="text-zinc-200 font-medium">{countLabel}</span>
          {isFiltered ? ` of ${items.length}` : ""}
          {normalizedQuery ? ` for \u201c${searchQuery.trim()}\u201d` : ""}
        </p>
        {isFiltered && (
          <button
            type="button"
            onClick={resetAllControls}
            className="underline hover:text-zinc-200 transition"
          >
            Reset filters
          </button>
        )}
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-3">
          <p className="text-sm text-zinc-300">
            No items match your current filter
            {normalizedQuery ? ` for "${searchQuery.trim()}"` : ""}.
          </p>
          <button
            type="button"
            onClick={resetAllControls}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-xs font-medium text-zinc-200 hover:border-zinc-500 transition"
          >
            Clear search &amp; filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {filteredItems.map((item) => {
            const isSold = (item.status ?? "").toLowerCase() === "sold";
            return (
              <Link
                key={item.id}
                href={`/items/${item.id}`}
                className={`group flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-zinc-600 ${
                  isSold ? "opacity-75" : ""
                }`}
              >
                {item.image_url ? (
                  <div className="aspect-[4/3] w-full overflow-hidden bg-zinc-900">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                ) : (
                  <div className="aspect-[4/3] w-full border-b border-dashed border-zinc-800 bg-zinc-900/70 flex flex-col items-center justify-center text-zinc-400 p-4 text-center">
                    <span className="text-xs uppercase tracking-widest">
                      No Image
                    </span>
                    <span className="text-xs opacity-70 mt-1">{item.title}</span>
                  </div>
                )}

                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h2 className="text-lg font-semibold leading-snug group-hover:underline">
                        {item.title}
                      </h2>
                      <span className="text-base font-semibold whitespace-nowrap text-zinc-100">
                        ₹{formatPrice(item.price)}
                      </span>
                    </div>

                    <p className="text-sm text-zinc-400 line-clamp-2 mb-4">
                      {item.description}
                    </p>
                  </div>

                  <div>
                    <span
                      className={`inline-block text-[11px] font-medium uppercase tracking-wider px-2.5 py-1 border rounded-full ${getStatusBadgeClasses(
                        item.status
                      )}`}
                    >
                      {item.status || "unknown"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}