import { StaticPage } from "../../../components/layout/StaticPage";

export default function TermsPage() {
  return (
    <StaticPage title="Terms of Service">
      <p className="text-xs italic">
        Placeholder terms for development. Replace with counsel-reviewed terms before any public launch —
        this is not legal advice.
      </p>
      <p>DilMil is a platform for adults (18+) to discover, match and communicate with other members for dating, friendship, and social connection.</p>
      <p>You must provide accurate registration information, including a truthful date of birth. Accounts found to misrepresent age are removed.</p>
      <p>Membership fees are described on the Pricing page and are set by the platform; premium plans affect visibility only, not outcomes.</p>
      <p>You are responsible for content you post and messages you send, and agree to the Community Guidelines.</p>
    </StaticPage>
  );
}
