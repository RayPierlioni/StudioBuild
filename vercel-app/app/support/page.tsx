import { LegalPage, legalMetadata } from "../legal-pages";

export const metadata = legalMetadata("support");

export default function SupportPage() {
  return <LegalPage pageKey="support" />;
}
