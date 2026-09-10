import { StaticPage } from "../../../components/layout/StaticPage";

const prohibited = [
  "Minors on the platform, in any form",
  "Harassment, threats or intimidation",
  "Scams, fraud or impersonation",
  "Spam or repetitive unsolicited messaging",
  "Non-consensual sharing of private information",
  "Sexual services, escorting or explicit sexual transactions",
  "Illegal activity of any kind",
  "Malicious links or malware",
  "Abuse directed at other members or staff",
];

export default function CommunityGuidelinesPage() {
  return (
    <StaticPage title="Community Guidelines">
      <p>By using Humraah you agree to the following rules. Violating them can result in content removal, suspension or a permanent ban.</p>
      <ul className="list-disc pl-5 space-y-1.5">
        {prohibited.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
      <p>You agree to these guidelines during onboarding, and they apply throughout your time on the platform.</p>
    </StaticPage>
  );
}
