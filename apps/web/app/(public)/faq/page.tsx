import { StaticPage } from "../../../components/layout/StaticPage";

const faqs: [string, string][] = [
  ["Is DilMil free?", "Basic access starts at Rs.499. Pro and Diamond plans offer enhanced visibility for an additional fee."],
  ["How is my age verified?", "We calculate your age from your date of birth on our servers at registration — not from a checkbox."],
  ["Do premium plans guarantee matches?", "No. Premium plans improve your profile's visibility and discovery ranking, not outcomes."],
  ["How do I report someone?", "Use the Report option on any profile, post, comment or conversation."],
  ["Can I delete my account?", "Yes, any time from Settings > Privacy & Safety."],
  ["Is my phone number visible to others?", "No. It's only shared if you and the other person both agree to a WhatsApp contact exchange."],
];

export default function FaqPage() {
  return (
    <StaticPage title="FAQ">
      <div className="space-y-5">
        {faqs.map(([q, a]) => (
          <div key={q}>
            <p className="font-medium text-ink">{q}</p>
            <p>{a}</p>
          </div>
        ))}
      </div>
    </StaticPage>
  );
}
