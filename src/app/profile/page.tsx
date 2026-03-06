"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchProfile() {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setName(data.name);
      }
      setLoading(false);
    }
    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status]);

  async function handleSave() {
    if (!name.trim() || name === profile?.name) return;
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setSaving(false);
    if (res.ok) {
      setProfile((prev) => prev ? { ...prev, name: name.trim() } : prev);
      toast("success", "Profile updated");
    } else {
      const data = await res.json();
      toast("error", data.error || "Failed to update profile");
    }
  }

  if (loading || !session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface-1)]">
        <div className="w-10 h-10 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initial = (profile?.name || "?").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[var(--surface-1)]">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--glass-bg)] backdrop-blur-md">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 sm:px-6 py-3">
          <button
            onClick={() => router.push("/")}
            className="p-2 rounded-full hover:bg-[var(--muted)] transition-colors"
            title="Back to dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-semibold">Profile</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center text-2xl text-white font-bold shadow-[var(--shadow-md)]">
              {initial}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{profile?.name}</h2>
              <p className="text-sm text-[var(--muted-foreground)]">{profile?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Display Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-[var(--border)] rounded-xl bg-[var(--surface-2)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/50 focus:border-[var(--ring)] transition-shadow"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                value={profile?.email || ""}
                disabled
                className="w-full px-3 py-2.5 text-sm border border-[var(--border)] rounded-xl bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed"
              />
            </div>

            {profile?.createdAt && (
              <p className="text-xs text-[var(--muted-foreground)]">
                Member since {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            )}

            <button
              onClick={handleSave}
              disabled={saving || !name.trim() || name === profile?.name}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-xl bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
