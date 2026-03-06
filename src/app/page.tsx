"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  Trash2,
  Search,
  LogOut,
  Star,
  Folder,
  Tag,
  Clock,
  ChevronDown,
  LayoutTemplate,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { DocumentMeta } from "@/types";
import type { DocumentTemplate } from "@/lib/templates";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { TemplateSelector } from "@/components/ui/TemplateSelector";

type ViewFilter = "all" | "starred" | "recent" | "folder" | "tag";

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const fetchDocuments = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (viewFilter === "starred") params.set("starred", "true");
    if (selectedFolder) params.set("folder", selectedFolder);
    if (selectedTag) params.set("tag", selectedTag);

    const url = search || viewFilter !== "all"
      ? `/api/documents/search?${params}`
      : "/api/documents";

    const res = await fetch(url);
    if (res.ok) {
      setDocuments(await res.json());
    }
    setLoading(false);
  }, [search, viewFilter, selectedFolder, selectedTag]);

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

  async function handleCreateFromTemplate(template: DocumentTemplate) {
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: template.name,
        templateId: template.id,
      }),
    });

    if (res.ok) {
      const { id } = await res.json();
      router.push(`/documents/${id}`);
    }
    setShowTemplates(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this document?")) return;

    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    }
  }

  async function handleToggleStar(id: string, isStarred: boolean) {
    const method = isStarred ? "DELETE" : "POST";
    await fetch(`/api/documents/${id}/star`, { method });
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, isStarred: !isStarred } : d
      )
    );
  }

  // Extract unique folders and tags
  const folders = [...new Set(documents.map((d) => d.folder).filter(Boolean))] as string[];
  const tags = [...new Set(documents.flatMap((d) => d.tags || []))];

  // Filter for recent (last 7 days)
  const filtered =
    viewFilter === "recent"
      ? documents.filter(
          (d) => Date.now() - new Date(d.updatedAt).getTime() < 7 * 24 * 60 * 60 * 1000
        )
      : documents;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">CollabEdit</h1>
          <div className="flex items-center gap-3">
            <NotificationBell />
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

      <div className="max-w-6xl mx-auto flex min-h-[calc(100vh-65px)]">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 border-r border-[var(--border)] py-6 pr-4 hidden md:block">
          <nav className="space-y-1">
            <button
              onClick={() => { setViewFilter("all"); setSelectedFolder(null); setSelectedTag(null); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg ${
                viewFilter === "all" ? "bg-[var(--accent)] text-[var(--primary)] font-medium" : "hover:bg-[var(--muted)]"
              }`}
            >
              <FileText size={16} /> All Documents
            </button>
            <button
              onClick={() => { setViewFilter("recent"); setSelectedFolder(null); setSelectedTag(null); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg ${
                viewFilter === "recent" ? "bg-[var(--accent)] text-[var(--primary)] font-medium" : "hover:bg-[var(--muted)]"
              }`}
            >
              <Clock size={16} /> Recent
            </button>
            <button
              onClick={() => { setViewFilter("starred"); setSelectedFolder(null); setSelectedTag(null); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg ${
                viewFilter === "starred" ? "bg-[var(--accent)] text-[var(--primary)] font-medium" : "hover:bg-[var(--muted)]"
              }`}
            >
              <Star size={16} /> Starred
            </button>

            {folders.length > 0 && (
              <>
                <div className="pt-4 pb-1 px-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                  Folders
                </div>
                {folders.map((f) => (
                  <button
                    key={f}
                    onClick={() => { setViewFilter("folder"); setSelectedFolder(f); setSelectedTag(null); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg truncate ${
                      viewFilter === "folder" && selectedFolder === f
                        ? "bg-[var(--accent)] text-[var(--primary)] font-medium"
                        : "hover:bg-[var(--muted)]"
                    }`}
                  >
                    <Folder size={16} /> {f}
                  </button>
                ))}
              </>
            )}

            {tags.length > 0 && (
              <>
                <div className="pt-4 pb-1 px-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                  Tags
                </div>
                <div className="flex flex-wrap gap-1 px-3">
                  {tags.map((t) => (
                    <button
                      key={t}
                      onClick={() => { setViewFilter("tag"); setSelectedTag(t); setSelectedFolder(null); }}
                      className={`px-2 py-0.5 text-xs rounded-full border ${
                        viewFilter === "tag" && selectedTag === t
                          ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                          : "border-[var(--border)] hover:bg-[var(--muted)]"
                      }`}
                    >
                      <Tag size={10} className="inline mr-0.5" />
                      {t}
                    </button>
                  ))}
                </div>
              </>
            )}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-6 py-6">
          {/* Actions bar */}
          <div className="flex items-center gap-3 mb-6">
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
            <div className="relative group">
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:opacity-90"
              >
                <Plus size={18} />
                New
                <ChevronDown size={14} />
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg z-50 hidden group-hover:block">
                <button
                  onClick={handleCreate}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--muted)] rounded-t-lg"
                >
                  <FileText size={16} />
                  Blank Document
                </button>
                <button
                  onClick={() => setShowTemplates(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--muted)] rounded-b-lg"
                >
                  <LayoutTemplate size={16} />
                  From Template
                </button>
              </div>
            </div>
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
                  : viewFilter === "starred"
                  ? "No starred documents"
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
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStar(doc.id, doc.isStarred);
                        }}
                        className={`p-1 rounded ${
                          doc.isStarred
                            ? "text-yellow-500"
                            : "text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100"
                        } hover:bg-[var(--muted)]`}
                        title={doc.isStarred ? "Unstar" : "Star"}
                      >
                        <Star size={16} fill={doc.isStarred ? "currentColor" : "none"} />
                      </button>
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
                  </div>
                  <h3 className="font-medium truncate">{doc.title}</h3>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    {formatDistanceToNow(new Date(doc.updatedAt), {
                      addSuffix: true,
                    })}
                  </p>
                  {/* Tags */}
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {doc.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 text-[10px] bg-[var(--muted)] rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Folder badge */}
                  {doc.folder && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-[var(--muted-foreground)]">
                      <Folder size={12} />
                      {doc.folder}
                    </div>
                  )}
                  {doc.collaborators.length > 0 && (
                    <div className="flex -space-x-2 mt-2">
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

      {/* Template selector modal */}
      {showTemplates && (
        <TemplateSelector
          onSelect={handleCreateFromTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
}
