"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
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
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-base">
      <form onSubmit={onSubmit} className="surface-card w-full max-w-sm p-8 space-y-4">
        <h1 className="font-display text-2xl font-semibold text-center">Welcome back</h1>
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
