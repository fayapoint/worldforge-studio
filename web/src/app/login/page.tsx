"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";
import { setAuthToken } from "@/lib/clientAuth";
import { Card, CardHint, CardTitle, Icon, PrimaryButton, SecondaryButton } from "@/lib/ui";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");
  const [tenantName, setTenantName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const title = useMemo(() => (mode === "login" ? "Login" : "Create account"), [mode]);

  async function submit() {
    setLoading(true);
    setError(null);

    const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const res = await apiFetch<{ token: string }>(path, {
      method: "POST",
      body: JSON.stringify({ tenantName, email, password }),
    });

    setLoading(false);

    if (!res.ok) {
      setError(`${res.error.code}: ${res.error.message}`);
      return;
    }

    setAuthToken(res.data.token);
    router.push("/app/projects");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-50 text-zinc-900">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-stretch gap-8 px-6 py-10 lg:grid-cols-2">
        <div className="hidden lg:flex">
          <div className="w-full rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-900 to-zinc-700 p-8 text-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <Icon name="sparkles" className="h-6 w-6" />
              </div>
              <div>
                <div className="text-lg font-semibold">WorldForge Studio</div>
                <div className="text-sm text-white/70">World & Story OS</div>
              </div>
            </div>

            <div className="mt-10 space-y-4">
              <div className="text-3xl font-semibold leading-tight">
                Build worlds.
                <br />
                Track continuity.
                <br />
                Generate cinematic prompts.
              </div>
              <div className="text-sm text-white/70">
                Create immersive story worlds with connected characters, locations, and events. Generate cinematic prompts
                for your creative projects.
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-3">
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="text-sm font-medium">Story Bible</div>
                <div className="mt-1 text-xs text-white/70">
                  Organize characters, locations, props, and events in one place.
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="text-sm font-medium">Continuity Check</div>
                <div className="mt-1 text-xs text-white/70">
                  Ensure consistency across your story with automatic validation.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <div className="mx-auto w-full max-w-lg">
            <div className="mb-6 flex items-center justify-center gap-2 lg:hidden">
              <div className="rounded-xl border border-zinc-200 bg-white p-2 shadow-sm">
                <Icon name="sparkles" className="h-5 w-5" />
              </div>
              <div className="text-sm font-semibold">WorldForge Studio</div>
            </div>

            <Card className="p-6">
              <div className="mb-5">
                <CardTitle>{title}</CardTitle>
                <CardHint>Sign in to access your projects, world bible, and story graph.</CardHint>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-2">
                <SecondaryButton
                  type="button"
                  onClick={() => setMode("login")}
                  className={mode === "login" ? "border-zinc-900" : ""}
                >
                  Login
                </SecondaryButton>
                <SecondaryButton
                  type="button"
                  onClick={() => setMode("register")}
                  className={mode === "register" ? "border-zinc-900" : ""}
                >
                  Register
                </SecondaryButton>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Tenant</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Password</label>
                  <input
                    type="password"
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {error ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
                ) : null}

                <PrimaryButton disabled={loading} onClick={submit} className="w-full">
                  <Icon name="arrowRight" className="h-4 w-4" />
                  {loading ? "Please wait…" : title}
                </PrimaryButton>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <button
                  className="text-zinc-700 underline"
                  onClick={() => setMode(mode === "login" ? "register" : "login")}
                >
                  {mode === "login" ? "Create account" : "Already have an account"}
                </button>
                <span className="text-zinc-500">MVP</span>
              </div>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
