"use client";
import { useState } from "react";
import { Navbar } from "../../../components/layout/Navigation";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";

export default function ContactPage() {
  const [form, setForm] = useState({ subject: "", category: "Account", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/support/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <>
      <Navbar />
      <main className="max-w-md mx-auto px-6 py-16">
        <h1 className="font-display text-3xl font-semibold mb-6">Contact Support</h1>
        {sent ? (
          <p className="surface-card p-5 text-sm">Thanks — our team will get back to you soon.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Input label="Subject" required value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
            <div>
              <label className="text-sm font-medium text-ink/80">Category</label>
              <select
                className="w-full mt-1.5 rounded-xl border border-black/10 px-3.5 py-2.5 text-sm"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {["Account", "Payment", "Membership", "Profile", "Chat", "Safety", "Reporting"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-ink/80">Message</label>
              <textarea
                required
                className="w-full mt-1.5 rounded-xl border border-black/10 px-3.5 py-2.5 text-sm h-32"
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              />
            </div>
            <Button type="submit" loading={loading} className="w-full">Send</Button>
          </form>
        )}
      </main>
    </>
  );
}
