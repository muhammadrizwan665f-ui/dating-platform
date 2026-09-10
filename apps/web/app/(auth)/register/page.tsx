"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    displayName: "",
    email: "",
    phone: "",
    password: "",
    dob: "",
    gender: "FEMALE",
    city: "",
    interestedIn: "MALE",
  });
  const [terms, setTerms] = useState(false);
  const [adult, setAdult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!terms || !adult) {
      setError("Please accept the terms and confirm you are 18 or older.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, termsAccepted: true, confirmedAdult: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Server recalculates age independently — this message surfaces that check too.
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      router.push("/onboarding");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-base">
      <form onSubmit={onSubmit} className="surface-card w-full max-w-md p-8 space-y-4">
        <h1 className="font-display text-2xl font-semibold text-center">Create your profile</h1>
        <p className="text-sm text-ink/50 text-center mb-4">18+ only. Every profile is reviewed before going live.</p>

        {error && <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</p>}

        <Input label="First name" required value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
        <Input label="Display name" required value={form.displayName} onChange={(e) => update("displayName", e.target.value)} />
        <Input label="Email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
        <Input label="Phone" required value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="03xxxxxxxxx" />
        <Input label="Password" type="password" required minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)} />
        <Input label="Date of birth" type="date" required value={form.dob} onChange={(e) => update("dob", e.target.value)} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-ink/80">Gender</label>
            <select
              className="w-full mt-1.5 rounded-xl border border-black/10 px-3.5 py-2.5 text-sm"
              value={form.gender}
              onChange={(e) => update("gender", e.target.value)}
            >
              <option value="FEMALE">Female</option>
              <option value="MALE">Male</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-ink/80">Interested in</label>
            <select
              className="w-full mt-1.5 rounded-xl border border-black/10 px-3.5 py-2.5 text-sm"
              value={form.interestedIn}
              onChange={(e) => update("interestedIn", e.target.value)}
            >
              <option value="MALE">Men</option>
              <option value="FEMALE">Women</option>
            </select>
          </div>
        </div>

        <Input label="City" required value={form.city} onChange={(e) => update("city", e.target.value)} />

        <label className="flex items-start gap-2 text-xs text-ink/60">
          <input type="checkbox" className="mt-0.5" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
          I agree to the Terms, Privacy Policy and Community Guidelines.
        </label>
        <label className="flex items-start gap-2 text-xs text-ink/60">
          <input type="checkbox" className="mt-0.5" checked={adult} onChange={(e) => setAdult(e.target.checked)} />
          I confirm I am 18 years of age or older.
        </label>

        <Button type="submit" loading={loading} className="w-full">
          Continue
        </Button>
      </form>
    </main>
  );
}
