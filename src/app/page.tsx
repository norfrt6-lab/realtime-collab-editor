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
  Menu,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { DocumentMeta } from "@/types";
import type { DocumentTemplate } from "@/lib/templates";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { TemplateSelector } from "@/components/ui/TemplateSelector";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { MobileMenu } from "@/components/ui/MobileMenu";

type ViewFilter = "all" | "starred" | "recent" | "folder" | "tag";

function getTagColor(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 50%)`;
}

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
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      router.push(`/documents/${id}?template=${template.id}`);
    }
    setShowTemplates(false);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    }
    setDeleteTarget(null);
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

  const folders = [...new Set(documents.map((d) => d.folder).filter(Boolean))] as string[];
  const tags = [...new Set(documents.flatMap((d) => d.tags || []))];

  const filtered =
    viewFilter === "recent"
      ? documents.filter(
          (d) => Date.now() - new Date(d.updatedAt).getTime() < 7 * 24 * 60 * 60 * 1000
        )
      : documents;

  const sidebarContent = (
    <nav className="space-y-1">
      {([
        { filter: "all" as const, icon: <FileText size={16} />, label: "All Documents" },
        { filter: "recent" as const, icon: <Clock size={16} />, label: "Recent" },
        { filter: "starred" as const, icon: <Star size={16} />, label: "Starred" },
      ]).map(({ filter, icon, label }) => (
        <button
          key={filter}
          onClick={() => { setViewFilter(filter); setSelectedFolder(null); setSelectedTag(null); setMobileMenuOpen(false); }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all duration-150 ${
            viewFilter === filter && !selectedFolder && !selectedTag
              ? "bg-[var(--accent)] text-[var(--primary)] font-medium border-l-3 border-[var(--primary)]"
              : "hover:bg-[var(--muted)] text-[var(--foreground)]"
          }`}
        >
          {icon} {label}
        </button>
      ))}

      {folders.length > 0 && (
        <>
          <div className="pt-5 pb-1.5 px-3 text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Folders
          </div>
          {folders.map((f) => (
            <button
              key={f}
              onClick={() => { setViewFilter("folder"); setSelectedFolder(f); setSelectedTag(null); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg truncate transition-all duration-150 ${
                viewFilter === "folder" && selectedFolder === f
                  ? "bg-[var(--accent)] text-[var(--primary)] font-medium border-l-3 border-[var(--primary)]"
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
          <div className="pt-5 pb-1.5 px-3 text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Tags
          </div>
          <div className="flex flex-wrap gap-1.5 px-3">
            {tags.map((t) => (
              <button
                key={t}
                onClick={() => { setViewFilter("tag"); setSelectedTag(t); setSelectedFolder(null); setMobileMenuOpen(false); }}
                className={`px-2.5 py-1 text-xs rounded-full border transition-all duration-150 ${
                  viewFilter === "tag" && selectedTag === t
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                    : "border-[var(--border)] hover:bg-[var(--muted)] hover:border-[var(--primary)]/30"
                }`}
              >
                <Tag size={10} className="inline mr-1" />
                {t}
              </button>
            ))}
          </div>
        </>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[var(--surface-1)]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--glass-bg)] backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-[var(--muted)] md:hidden"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] bg-clip-text text-transparent">
              CollabEdit
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
            <span className="text-sm text-[var(--muted-foreground)] hidden sm:block">
              {session?.user?.name}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-full hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto flex min-h-[calc(100vh-57px)]">
        {/* Desktop Sidebar */}
        <aside className="w-56 shrink-0 border-r border-[var(--border)] py-6 pr-4 hidden md:block">
          {sidebarContent}
        </aside>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <MobileMenu onClose={() => setMobileMenuOpen(false)}>
            {sidebarContent}
          </MobileMenu>
        )}

        {/* Main content */}
        <main className="flex-1 px-4 sm:px-6 py-6">
          {/* Actions bar */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                size={18}
              />
              <input
                type="text"
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/50 focus:border-[var(--ring)] focus:shadow-[var(--shadow-sm)] transition-all"
              />
            </div>
            <div className="relative group">
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-4 py-2.5 text-white font-medium rounded-xl bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 hover:-translate-y-px hover:shadow-[var(--shadow-md)] transition-all duration-200"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">New</span>
                <ChevronDown size={14} />
              </button>
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-[var(--popover)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-lg)] z-50 hidden group-hover:block animate-slide-in-down overflow-hidden">
                <button
                  onClick={handleCreate}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--muted)] transition-colors"
                >
                  <FileText size={16} className="text-[var(--primary)]" />
                  Blank Document
                </button>
                <div className="h-px bg-[var(--border)]" />
                <button
                  onClick={() => setShowTemplates(true)}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--muted)] transition-colors"
                >
                  <LayoutTemplate size={16} className="text-[var(--primary)]" />
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
                  className="h-44 rounded-xl shimmer-loading"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--muted)] flex items-center justify-center">
                <FileText className="text-[var(--muted-foreground)]" size={32} />
              </div>
              <p className="text-[var(--muted-foreground)] text-lg">
                {search
                  ? "No documents match your search"
                  : viewFilter === "starred"
                  ? "No starred documents"
                  : "No documents yet"}
              </p>
              {!search && viewFilter === "all" && (
                <button
                  onClick={handleCreate}
                  className="mt-4 px-4 py-2 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 transition-opacity"
                >
                  Create your first document
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => router.push(`/documents/${doc.id}`)}
                  className="group relative bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 cursor-pointer shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-lg)] hover:border-[var(--primary)]/40 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                >
                  {/* Gradient accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent)] flex items-center justify-center">
                      <FileText className="text-[var(--primary)]" size={20} />
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStar(doc.id, doc.isStarred);
                        }}
                        className={`p-1.5 rounded-lg transition-all duration-150 ${
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
                            setDeleteTarget(doc.id);
                          }}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[var(--destructive)]/10 text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-all duration-150"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <h3 className="font-semibold truncate text-[var(--card-foreground)]">{doc.title}</h3>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                  </p>
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {doc.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-[10px] font-medium rounded-full"
                          style={{
                            backgroundColor: `${getTagColor(tag)}15`,
                            color: getTagColor(tag),
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {doc.folder && (
                    <div className="flex items-center gap-1 mt-2.5 text-xs text-[var(--muted-foreground)]">
                      <Folder size={12} />
                      {doc.folder}
                    </div>
                  )}
                  {doc.collaborators.length > 0 && (
                    <div className="flex -space-x-2 mt-3">
                      {doc.collaborators.slice(0, 3).map((c, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full bg-[var(--primary)] border-2 border-[var(--card)] flex items-center justify-center text-[10px] text-white font-medium shadow-[var(--shadow-xs)]"
                        >
                          {i + 1}
                        </div>
                      ))}
                      {doc.collaborators.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-[var(--muted)] border-2 border-[var(--card)] flex items-center justify-center text-[10px] font-medium">
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

      {showTemplates && (
        <TemplateSelector
          onSelect={handleCreateFromTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Document"
          description="This action cannot be undone. The document and all its history will be permanently deleted."
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
