import { StaticPage } from "../../../components/layout/StaticPage";

export default function SafetyPage() {
  return (
    <StaticPage title="Safety">
      <p>DilMil is an 18+ only platform. Age is calculated server-side from date of birth at registration — it is never taken solely on a checkbox.</p>
      <p>Every profile is reviewed by our team before it becomes visible to others. Photos, bio and basic details are checked against our community guidelines.</p>
      <p>You control who can contact you: block anyone at any time, and reporting is available on every profile, post, comment and conversation.</p>
      <p>Your phone number is never shared automatically. WhatsApp contact exchange only happens when both people explicitly agree.</p>
      <p>Your precise location is never shown to other users — only your city.</p>
      <p>If you ever feel unsafe, use the Report button or contact our support team directly.</p>
    </StaticPage>
  );
}
