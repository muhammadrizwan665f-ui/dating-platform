import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Humraah — Meet. Match. Connect.",
    template: "%s | Humraah",
  },
  description:
    "An 18+ dating and social discovery community for Pakistan. Verified profiles, private chat, and real connections.",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
