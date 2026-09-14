"use client";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { identifier, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email/phone or password.");
      return;
    }
    // If we were bounced here from a protected page (e.g. /admin), go back
    // there instead of always landing on /dashboard.
    const next = searchParams.get("next");
    router.push(next && next.startsWith("/") ? next : "/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-rose-50 via-base to-plum-500/10 relative overflow-hidden">
      <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-rose-200/40 blur-3xl" />
      <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-plum-500/10 blur-3xl" />

      <form onSubmit={onSubmit} className="relative surface-card w-full max-w-sm p-8 space-y-4 shadow-cardHover">
        <div className="text-center mb-2">
          <p className="font-display text-2xl font-semibold text-rose-500">💗 DilMil</p>
          <h1 className="font-display text-xl font-semibold mt-3">Welcome back</h1>
          <p className="text-xs text-ink/50 mt-1">Log in to continue your journey ❤️</p>
        </div>
        {error && <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</p>}
        <Input label="Email or phone" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
        <Input label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" loading={loading} className="w-full">
          Log in
        </Button>
        <p className="text-xs text-center text-ink/50">
          Don&apos;t have an account? <a href="/register" className="text-rose-500 font-medium">Create one</a>
        </p>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
