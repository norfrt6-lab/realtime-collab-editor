import type { Metadata } from "next";
import { AuthProvider } from "@/components/ui/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "CollabEdit - Real-Time Collaborative Editor",
  description:
    "Google Docs-style collaborative editor with real-time multi-user editing, presence awareness, version history, and comments.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
