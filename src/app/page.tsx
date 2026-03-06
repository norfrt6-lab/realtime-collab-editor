"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, FileText, Trash2, Search, LogOut } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { DocumentMeta } from "@/types";

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchDocuments = useCallback(async () => {
    const res = await fetch("/api/documents");
    if (res.ok) {
      setDocuments(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  async function handleCreate() {
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled Document" }),
    });

    if (res.ok) {
      const { id } = await res.json();
      router.push(`/documents/${id}`);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this document?")) return;

    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    }
  }

  const filtered = documents.filter((doc) =>
    doc.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">CollabEdit</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--muted-foreground)]">
              {session?.user?.name}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Actions bar */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
              size={18}
            />
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:opacity-90"
          >
            <Plus size={18} />
            New Document
          </button>
        </div>

        {/* Document grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-40 bg-[var(--muted)] rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText
              className="mx-auto mb-4 text-[var(--muted-foreground)]"
              size={48}
            />
            <p className="text-[var(--muted-foreground)]">
              {search
                ? "No documents match your search"
                : "No documents yet. Create your first one!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((doc) => (
              <div
                key={doc.id}
                onClick={() => router.push(`/documents/${doc.id}`)}
                className="group border border-[var(--border)] rounded-lg p-4 cursor-pointer hover:border-[var(--primary)] hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <FileText
                    className="text-[var(--primary)] shrink-0"
                    size={24}
                  />
                  {doc.ownerId === session?.user?.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(doc.id);
                      }}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <h3 className="font-medium truncate">{doc.title}</h3>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  {formatDistanceToNow(new Date(doc.updatedAt), {
                    addSuffix: true,
                  })}
                </p>
                {doc.collaborators.length > 0 && (
                  <div className="flex -space-x-2 mt-3">
                    {doc.collaborators.slice(0, 3).map((c, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full bg-[var(--primary)] border-2 border-[var(--background)] flex items-center justify-center text-xs text-white"
                      >
                        {i + 1}
                      </div>
                    ))}
                    {doc.collaborators.length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-[var(--muted)] border-2 border-[var(--background)] flex items-center justify-center text-xs">
                        +{doc.collaborators.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
