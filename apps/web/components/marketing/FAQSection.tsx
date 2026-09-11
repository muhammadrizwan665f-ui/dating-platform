"use client";
import { useState } from "react";

const FAQS = [
  ["Is DilMil only for people looking for marriage?", "No — DilMil supports dating, friendship, and serious relationships. You choose your intention on your profile."],
  ["How does profile approval work?", "Every new profile is reviewed by our team before it becomes visible in Discover, usually within a day."],
  ["How does matching work?", "When two people both like each other, it becomes a mutual match and a chat opens up automatically."],
  ["Can I block someone?", "Yes, any time, from their profile. Blocked users can't message, like, or view your profile."],
  ["Can I report a profile?", "Yes — every profile has a report option for spam, fake profiles, harassment or other concerns."],
  ["Is my WhatsApp number public?", "Never automatically. Someone must request it, and you choose to accept or decline before it's ever shared."],
  ["How do memberships work?", "Basic is free. Paid plans (Pro, Diamond) add visibility and features — never guaranteed matches or replies."],
  ["Is DilMil 18+ only?", "Yes, strictly. Age is verified server-side at signup, not just a checkbox."],
] as const;

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-16 px-5 sm:px-8">
      <div className="max-w-2xl mx-auto">
        <h2 className="font-display text-3xl font-semibold text-center mb-10">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQS.map(([q, a], i) => (
            <div key={q} className="surface-card overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between text-left px-5 py-4 text-sm font-medium"
              >
                {q}
                <span className={`text-rose-400 transition-transform shrink-0 ml-3 ${open === i ? "rotate-45" : ""}`}>+</span>
              </button>
              {open === i && <p className="px-5 pb-4 text-sm text-ink/60 leading-relaxed">{a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
