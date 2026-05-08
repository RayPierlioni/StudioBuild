import { LegalPage, legalMetadata } from "../legal-pages";

export const metadata = legalMetadata("terms");

export default function TermsPage() {
  return <LegalPage pageKey="terms" />;
}
