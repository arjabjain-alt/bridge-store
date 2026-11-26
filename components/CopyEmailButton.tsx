"use client";

import { useState } from "react";

type CopyEmailButtonProps = {
  email: string;
  inquiryText?: string;
};

export default function CopyEmailButton({
  email,
  inquiryText,
}: CopyEmailButtonProps) {
  const [copiedTarget, setCopiedTarget] = useState<"email" | "inquiry" | null>(
    null
  );

  async function copyValue(value: string, target: "email" | "inquiry") {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedTarget(target);
      setTimeout(() => {
        setCopiedTarget((current) => (current === target ? null : current));
      }, 2000);
    } catch {
      setCopiedTarget(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button
        type="button"
        onClick={() => copyValue(email, "email")}
        className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-zinc-800 bg-transparent text-zinc-300 text-sm font-medium hover:border-zinc-600 hover:text-zinc-100 transition cursor-pointer"
      >
        {copiedTarget === "email" ? "Copied email!" : "Copy email"}
      </button>

      {inquiryText && (
        <button
          type="button"
          onClick={() => copyValue(inquiryText, "inquiry")}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-zinc-800 bg-transparent text-zinc-300 text-sm font-medium hover:border-zinc-600 hover:text-zinc-100 transition cursor-pointer"
        >
          {copiedTarget === "inquiry"
            ? "Copied inquiry text!"
            : "Copy inquiry text"}
        </button>
      )}
    </div>
  );
}