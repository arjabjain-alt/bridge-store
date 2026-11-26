"use client";

import { useEffect, useState, FormEvent } from "react";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = "arjab.jain@englivo.com";
const BUCKET_NAME = "artwork";

type ArtworkItem = {
  id: number;
  created_at: string;
  title: string;
  price: number;
  description: string | null;
  image_url: string;
  status: string;
};

export default function StudioDeskPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Login form state
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  // New artwork form state
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"available" | "sold">("available");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Inventory list state
  const [items, setItems] = useState<ArtworkItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const isAuthorizedAdmin =
    userEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  async function loadItems() {
    setLoadingItems(true);
    const { data, error } = await supabase
      .from("items")
      .select("id, created_at, title, price, description, image_url, status")
      .order("id", { ascending: false });

    if (!error && data) {
      setItems(data);
    }
    setLoadingItems(false);
  }

  useEffect(() => {
    let mounted = true;

    async function initSession() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const currentEmail = data.session?.user?.email ?? null;
      setUserEmail(currentEmail);
      setCheckingSession(false);

      if (currentEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        loadItems();
      }
    }

    initSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        const currentEmail = session?.user?.email ?? null;
        setUserEmail(currentEmail);
        if (currentEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          loadItems();
        } else {
          setItems([]);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setSigningIn(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setSigningIn(false);

    if (error) {
      setAuthError(error.message);
      return;
    }

    const signedInEmail = data.user?.email ?? null;
    if (signedInEmail?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      await supabase.auth.signOut();
      setAuthError("This account is not authorized for Studio Desk.");
      return;
    }

    setUserEmail(signedInEmail);
    setPassword("");
    loadItems();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUserEmail(null);
    setItems([]);
  }

  async function handleCreateArtwork(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setErrorMsg(null);

    if (!isAuthorizedAdmin) {
      setErrorMsg("Unauthorized admin session.");
      return;
    }

    if (!file) {
      setErrorMsg("Please choose an artwork image to upload.");
      return;
    }

    const numericPrice = Number(price);
    if (!title.trim() || Number.isNaN(numericPrice) || numericPrice <= 0) {
      setErrorMsg("Please enter a valid title and positive price.");
      return;
    }

    setSubmitting(true);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;
      const filePath = `artworks/${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Image upload failed: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase.from("items").insert({
        title: title.trim(),
        price: numericPrice,
        description: description.trim() || null,
        image_url: publicUrlData.publicUrl,
        status,
      });

      if (insertError) {
        throw new Error(`Saving artwork failed: ${insertError.message}`);
      }

      setTitle("");
      setPrice("");
      setDescription("");
      setStatus("available");
      setFile(null);
      const fileInput = document.getElementById(
        "artwork-file-input"
      ) as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";

      setMessage("Artwork published to Bridge Store!");
      await loadItems();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Something went wrong uploading."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(item: ArtworkItem) {
    if (!isAuthorizedAdmin) return;
    setErrorMsg(null);
    setMessage(null);
    setUpdatingId(item.id);

    const nextStatus = item.status === "available" ? "sold" : "available";

    const { error } = await supabase
      .from("items")
      .update({ status: nextStatus })
      .eq("id", item.id);

    setUpdatingId(null);

    if (error) {
      setErrorMsg(`Could not update status: ${error.message}`);
      return;
    }

    setMessage(`"${item.title}" marked as ${nextStatus}.`);
    setItems((prev) =>
      prev.map((row) =>
        row.id === item.id ? { ...row, status: nextStatus } : row
      )
    );
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="text-sm text-neutral-500">Checking session...</p>
      </main>
    );
  }

  if (!isAuthorizedAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm border border-neutral-200 rounded-lg p-6 space-y-4 bg-white"
        >
          <h1 className="text-xl font-semibold">Studio Desk Sign In</h1>
          <p className="text-sm text-neutral-600">
            Sign in with your administrator account to manage Bridge Store.
          </p>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          {authError && (
            <p className="text-sm text-red-600">{authError}</p>
          )}

          <button
            type="submit"
            disabled={signingIn}
            className="w-full rounded bg-black text-white py-2 text-sm font-medium disabled:opacity-50"
          >
            {signingIn ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-10">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold">Studio Desk</h1>
          <p className="text-sm text-neutral-600">
            Signed in as {userEmail}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="border rounded px-3 py-1.5 text-sm hover:bg-neutral-100"
        >
          Sign Out
        </button>
      </div>

      {message && (
        <div className="rounded border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          {message}
        </div>
      )}
      {errorMsg && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {errorMsg}
        </div>
      )}

      {/* Upload New Artwork */}
      <section className="border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold">Upload New Artwork</h2>
        <form onSubmit={handleCreateArtwork} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium">Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Monsoon Study II"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium">Price (₹)</label>
              <input
                type="number"
                required
                min="1"
                step="any"
                placeholder="e.g. 4500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">
              Description (optional)
            </label>
            <textarea
              rows={3}
              placeholder="Medium, dimensions, notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium">Status</label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "available" | "sold")
                }
                className="w-full border rounded px-3 py-2 text-sm bg-white"
              >
                <option value="available">available</option>
                <option value="sold">sold</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium">Artwork Image</label>
              <input
                id="artwork-file-input"
                type="file"
                accept="image/*"
                required
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full border rounded px-3 py-1.5 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-black text-white px-5 py-2 text-sm font-medium disabled:opacity-50"
          >
            {submitting ? "Uploading..." : "Publish Artwork"}
          </button>
        </form>
      </section>

      {/* Manage Existing Inventory */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Manage Inventory</h2>

        {loadingItems ? (
          <p className="text-sm text-neutral-500">Loading artworks...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-neutral-500">No items found yet.</p>
        ) : (
          <div className="divide-y border rounded-lg">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 p-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-14 h-14 object-cover rounded border shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item.title}</p>
                    <p className="text-sm text-neutral-600">
                      ₹{item.price} ·{" "}
                      <span className="font-medium uppercase">
                        {item.status}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={updatingId === item.id}
                  onClick={() => handleToggleStatus(item)}
                  className="border rounded px-3 py-1.5 text-sm shrink-0 hover:bg-neutral-100 disabled:opacity-50"
                >
                  {updatingId === item.id
                    ? "Updating..."
                    : item.status === "available"
                    ? "Mark Sold"
                    : "Mark Available"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}