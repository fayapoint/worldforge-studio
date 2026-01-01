"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearAuthToken } from "@/lib/clientAuth";
import { Icon } from "@/lib/ui";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  function logout() {
    clearAuthToken();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-50 text-zinc-900">
      <div className="sticky top-0 z-10 border-b border-zinc-200/70 bg-white/70 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-2 shadow-sm">
              <Icon name="sparkles" className="h-5 w-5 text-zinc-900" />
            </div>
            <div className="min-w-0">
              <Link href="/app/projects" className="block text-sm font-semibold leading-tight">
                WorldForge Studio
              </Link>
              <div className="text-xs text-zinc-500">World & Story OS</div>
            </div>
          </div>

          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm hover:bg-zinc-50"
          >
            <Icon name="logout" className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      <div className="px-6 py-4">{children}</div>
    </div>
  );
}
