import { StaticPage } from "../../../components/layout/StaticPage";

export default function PrivacyPage() {
  return (
    <StaticPage title="Privacy Policy">
      <p className="text-xs italic">
        Placeholder privacy policy for development. Replace with counsel-reviewed text covering Pakistani
        data-protection requirements before any public launch — this is not legal advice.
      </p>
      <p>We collect the information you provide at registration and in your profile, along with usage data needed to operate matching, chat and moderation.</p>
      <p>We never display your exact location, phone number or payment details to other users. WhatsApp contact is only exchanged with mutual consent.</p>
      <p>Payment and audit records are retained as required for financial and legal compliance, even after account deletion.</p>
      <p>You can request account deletion at any time from Settings.</p>
    </StaticPage>
  );
}
