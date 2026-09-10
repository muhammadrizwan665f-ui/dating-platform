import { StaticPage } from "../../../components/layout/StaticPage";

const steps = [
  ["Create your profile", "Register with your real details. We verify your age server-side."],
  ["Get approved", "Our team reviews your profile before it goes live."],
  ["Discover people", "Browse profiles that match your preferences."],
  ["Match", "When you both like each other, it's a match."],
  ["Chat", "Message privately in a realtime, WhatsApp-style chat."],
  ["Connect", "Build genuine connections, at your own pace."],
];

export default function HowItWorksPage() {
  return (
    <StaticPage title="How It Works">
      <ol className="space-y-4">
        {steps.map(([title, desc], i) => (
          <li key={title}>
            <p className="font-medium text-ink">{i + 1}. {title}</p>
            <p>{desc}</p>
          </li>
        ))}
      </ol>
    </StaticPage>
  );
}
