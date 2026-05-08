import { LegalPage, legalMetadata } from "../legal-pages";

export const metadata = legalMetadata("refunds");

export default function RefundsPage() {
  return <LegalPage pageKey="refunds" />;
}
