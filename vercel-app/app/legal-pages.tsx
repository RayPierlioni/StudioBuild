import type { Metadata } from "next";

type LegalSection = {
  title: string;
  body: string[];
};

type LegalPageContent = {
  title: string;
  eyebrow: string;
  description: string;
  updated: string;
  sections: LegalSection[];
};

export const supportEmail = "rpierlioni@gmail.com";

export const legalPages = {
  privacy: {
    title: "Privacy Policy",
    eyebrow: "Privacy",
    description:
      "How MiseForge handles account data, project content, billing data, analytics, and support requests.",
    updated: "May 8, 2026",
    sections: [
      {
        title: "What We Collect",
        body: [
          "When you sign in with Google, MiseForge receives basic account information such as your email address and sign-in identifier so we can create and protect your workspace.",
          "When you use the app, we store the project information you choose to save, including titles, notes, scripts, scene packets, bibles, shot lists, prompt cards, schedules, sound maps, and production packet material.",
          "When you subscribe, Stripe processes billing information. MiseForge stores subscription status, customer identifiers, and related billing references so the app can unlock paid access and open the billing portal.",
          "We use Vercel Web Analytics and app event tracking to understand product usage, such as landing page clicks, project creation, scene-packet saves, checkout intent, and export clicks.",
        ],
      },
      {
        title: "How We Use Information",
        body: [
          "We use account and project information to provide the MiseForge workspace, save projects, enforce free and paid access, support billing, respond to support requests, and improve the product.",
          "We do not sell your personal information. We share information with service providers only as needed to run the product, including Supabase for authentication and database storage, Stripe for billing, Vercel for hosting and analytics, and Google for sign-in.",
        ],
      },
      {
        title: "Google Sign-In",
        body: [
          "MiseForge uses Google sign-in for authentication. We use Google account data only to identify and authenticate your account and to support account-related communication.",
          "If MiseForge changes how it uses Google user data, we will update this policy and request consent where required before using that data in a new way.",
        ],
      },
      {
        title: "Project Content",
        body: [
          "You keep ownership of the project content you create or upload. MiseForge uses that content to provide the workspace features you request.",
          "Do not upload private, confidential, or third-party material unless you have the right to use it in your project.",
        ],
      },
      {
        title: "Security and Retention",
        body: [
          "We use hosted providers and access controls to protect account, project, and billing-related data. No online service can guarantee perfect security.",
          "We keep account and project information while your account or project remains active, or as needed for billing, security, support, and legal obligations.",
        ],
      },
      {
        title: "Contact",
        body: [
          `For privacy questions or account requests, contact ${supportEmail}.`,
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    eyebrow: "Terms",
    description:
      "The basic rules for using MiseForge, creating projects, subscribing to Founder Pro, and working with third-party services.",
    updated: "May 8, 2026",
    sections: [
      {
        title: "Using MiseForge",
        body: [
          "MiseForge is a pre-production workspace for AI filmmakers. You may use it to organize film ideas, scripts, scene packets, shot lists, prompt cards, continuity plans, sound maps, schedules, and production packets.",
          "You are responsible for the projects, scripts, references, prompts, and other content you add to the service.",
        ],
      },
      {
        title: "Accounts",
        body: [
          "You need a Google-authenticated account to save projects and use account-specific app features.",
          "You are responsible for keeping your account secure and for any activity that happens through your account.",
        ],
      },
      {
        title: "Subscriptions",
        body: [
          "Founder Pro is a monthly subscription that unlocks multiple projects and premium workflow features. Subscription pricing is shown before checkout.",
          "Billing is processed by Stripe. You can manage or cancel your subscription through the Stripe billing portal linked inside MiseForge.",
        ],
      },
      {
        title: "User Content and Rights",
        body: [
          "You retain ownership of the original project content you create or upload. MiseForge does not claim ownership of your scripts, notes, or film materials.",
          "By using the app, you give MiseForge permission to store, process, and display your content only as needed to provide the service.",
        ],
      },
      {
        title: "Acceptable Use",
        body: [
          "Do not use MiseForge to violate laws, infringe intellectual property, harass others, upload malicious code, attempt unauthorized access, or interfere with the service.",
          "Do not rely on MiseForge as legal, financial, production-insurance, or rights-clearance advice. You are responsible for reviewing your own projects and releases.",
        ],
      },
      {
        title: "Service Changes",
        body: [
          "MiseForge is an actively developed product. Features, pricing, limits, and workflows may change as the product improves.",
          "We may suspend or discontinue access if an account abuses the service, creates security risk, or violates these terms.",
        ],
      },
      {
        title: "Contact",
        body: [`For terms questions, contact ${supportEmail}.`],
      },
    ],
  },
  refunds: {
    title: "Refunds and Cancellations",
    eyebrow: "Billing",
    description:
      "How Founder Pro cancellation, billing portal access, failed access, and refund review work.",
    updated: "May 8, 2026",
    sections: [
      {
        title: "Monthly Billing",
        body: [
          "Founder Pro is billed monthly through Stripe at the price shown during checkout.",
          "Subscriptions renew automatically until canceled.",
        ],
      },
      {
        title: "Cancellations",
        body: [
          "You can cancel Founder Pro from the Stripe billing portal linked inside the app.",
          "Cancellation stops future renewals. Unless Stripe or the app shows otherwise, access generally remains available until the end of the current paid billing period.",
        ],
      },
      {
        title: "Refund Review",
        body: [
          "Because MiseForge is a digital subscription, monthly charges are generally non-refundable once the billing period has started.",
          "If you were charged by mistake, cannot access paid features after checkout, or believe there is a billing error, contact support within 7 days and we will review it.",
          "Refunds required by law will be honored.",
        ],
      },
      {
        title: "Support",
        body: [
          `For billing help, include the email used at checkout and contact ${supportEmail}. Do not send card numbers or payment details by email.`,
        ],
      },
    ],
  },
  support: {
    title: "Support",
    eyebrow: "Help",
    description:
      "Get help with sign-in, billing, project access, bugs, and launch-stage product questions.",
    updated: "May 8, 2026",
    sections: [
      {
        title: "Contact",
        body: [
          `Email ${supportEmail} for account, billing, or product support.`,
          "Include the email address used for your MiseForge account, the page where the issue happened, and a short description of what you expected to happen.",
        ],
      },
      {
        title: "Billing Help",
        body: [
          "Use the billing portal inside MiseForge to manage or cancel Founder Pro.",
          "If checkout succeeds but Founder Pro does not unlock, contact support with the checkout email and approximate purchase time.",
        ],
      },
      {
        title: "Bug Reports",
        body: [
          "For bugs, include your browser, device, the project step you were using, and any visible error message.",
          "Do not email card numbers, passwords, API keys, or private production contracts.",
        ],
      },
      {
        title: "Current Launch Status",
        body: [
          "MiseForge is in professional beta. The product is live, actively improved, and focused on workflow-first AI filmmaking pre-production.",
        ],
      },
    ],
  },
} satisfies Record<string, LegalPageContent>;

export type LegalPageKey = keyof typeof legalPages;

export function legalMetadata(key: LegalPageKey): Metadata {
  const page = legalPages[key];

  return {
    title: `${page.title} | MiseForge`,
    description: page.description,
  };
}

export function LegalPage({ pageKey }: { pageKey: LegalPageKey }) {
  const page = legalPages[pageKey];

  return (
    <main className="legal-shell">
      <header className="legal-topbar">
        <a className="brand-link" href="/">
          MISEFORGE
        </a>
        <nav aria-label="Legal navigation">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/refunds">Refunds</a>
          <a href="/support">Support</a>
          <a href="/app">Open App</a>
        </nav>
      </header>

      <section className="legal-hero">
        <p className="eyebrow">{page.eyebrow}</p>
        <h1>{page.title}</h1>
        <p>{page.description}</p>
        <span>Last updated {page.updated}</span>
      </section>

      <section className="legal-panel" aria-label={page.title}>
        {page.sections.map((section) => (
          <article className="legal-section" key={section.title}>
            <h2>{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </article>
        ))}
      </section>
    </main>
  );
}
