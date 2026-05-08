import { LegalPage, legalMetadata } from "../legal-pages";

export const metadata = legalMetadata("privacy");

export default function PrivacyPage() {
  return <LegalPage pageKey="privacy" />;
}
