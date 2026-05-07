import { notFound } from "next/navigation";

import { MiniPhilosopherGuide, StudioWorkspace, type GuideAssistantContext, type StartMode } from "../../../studio-workspace";

type RouteContext = {
  params: { mode: string } | Promise<{ mode: string }>;
};

const startModes: Record<
  Exclude<StartMode, "dashboard">,
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    steps: string[];
  }
> = {
  idea: {
    eyebrow: "Idea start",
    title: "Start with the spark.",
    subtitle:
      "Use this path when you have the feeling, world, character, or premise but not the structure yet.",
    steps: [
      "Name the project and define the genre.",
      "Write the first version of the logline.",
      "Capture the image, conflict, or character that made the idea worth building.",
    ],
  },
  script: {
    eyebrow: "Script intake",
    title: "Bring the pages in.",
    subtitle:
      "Use this path when you already have script pages and want MiseForge to help organize the work ahead.",
    steps: [
      "Create a project shell for the script.",
      "Paste or import the script fragment.",
      "Open the project and start turning pages into scene packets.",
    ],
  },
  breakdown: {
    eyebrow: "Breakdown builder",
    title: "Turn the scene into a plan.",
    subtitle:
      "Use this path when you need production clarity: characters, props, wardrobe, sound, shots, and continuity.",
    steps: [
      "Create the project around the scene or short film.",
      "Paste the scene you want to break down.",
      "Open the project and build scene packets, shot lists, and prompt cards.",
    ],
  },
};

export default async function StartModePage({ params }: RouteContext) {
  const { mode } = await params;
  const startMode = mode as Exclude<StartMode, "dashboard">;
  const copy = startModes[startMode];

  if (!copy) {
    notFound();
  }

  const guideContext: GuideAssistantContext = {
    activeStageLabel: copy.eyebrow,
    assetCount: 0,
    body: copy.subtitle,
    chips: copy.steps.slice(0, 3),
    eyebrow: "MiseForge Guide",
    nextAction: copy.steps[0],
    planLabel: "Free",
    projectTitle: "New film",
    readinessScore: 0,
    sceneCount: 0,
    speech: copy.subtitle,
    title: copy.title,
  };

  return (
    <main className="app-shell">
      <header className="app-topbar">
        <a className="brand-link" href="/app">
          Back to Guide
        </a>
        <nav aria-label="Start flow navigation">
          <a href="/">Landing</a>
          <a href="/app">App Home</a>
        </nav>
      </header>

      <section className="start-hero">
        <MiniPhilosopherGuide compact context={guideContext} minimal />
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
          <ol>
            {copy.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </section>

      <section className="app-workspace">
        <StudioWorkspace startMode={startMode} />
      </section>
    </main>
  );
}
