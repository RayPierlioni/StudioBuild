import { notFound } from "next/navigation";

import { AuthReturnHandler } from "../../../auth-handler";
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
  treatment: {
    eyebrow: "Treatment start",
    title: "Start with the story map.",
    subtitle:
      "Use this path when you already have a synopsis, beat sheet, outline, or treatment draft.",
    steps: [
      "Create a project shell for the story map.",
      "Paste the treatment, synopsis, or beat sheet.",
      "Open the treatment room and turn it into a sharper blueprint.",
    ],
  },
  characters: {
    eyebrow: "Character start",
    title: "Start with the people.",
    subtitle:
      "Use this path when character identity, look, wardrobe, voice, or casting clarity is your first problem.",
    steps: [
      "Create a project shell around the character notes.",
      "Paste descriptions, wardrobe, relationships, or visual references.",
      "Open the character bible room and lock continuity anchors.",
    ],
  },
  locations: {
    eyebrow: "Location start",
    title: "Start with the world.",
    subtitle:
      "Use this path when locations, set dressing, lighting, or recurring spaces need to stay consistent.",
    steps: [
      "Create a project shell around the location notes.",
      "Paste layout, palette, dressing, sound, and light rules.",
      "Open the location bible room and build consistency anchors.",
    ],
  },
  lookbook: {
    eyebrow: "Look book start",
    title: "Start with the visual language.",
    subtitle:
      "Use this path when you already know the palette, camera feeling, references, or mood board.",
    steps: [
      "Create a project shell around the visual direction.",
      "Paste references, palette, lighting, camera, and motif notes.",
      "Open the look book room and turn taste into rules.",
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
  dialogue: {
    eyebrow: "Dialogue cleanup",
    title: "Start with pages that need a human pass.",
    subtitle:
      "Use this path when you already have dialogue and want to remove AI voice, exposition, or flat subtext.",
    steps: [
      "Create a project shell for the pages.",
      "Paste the dialogue or script section.",
      "Open the script room, then run the AI Voice Scanner.",
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
  continuity: {
    eyebrow: "Continuity start",
    title: "Start with what must not drift.",
    subtitle:
      "Use this path when props, wardrobe, location state, character state, lighting, or timeline details need tracking.",
    steps: [
      "Create a project shell around continuity notes.",
      "Paste the cross-scene risks or production memory.",
      "Open the continuity tracker and turn loose notes into checks.",
    ],
  },
  schedule: {
    eyebrow: "Schedule start",
    title: "Start with production order.",
    subtitle:
      "Use this path when the next problem is what to generate, review, lock, and export first.",
    steps: [
      "Create a project shell around the production plan.",
      "Paste generation order, tool handoffs, or deadlines.",
      "Open the schedule room and build a production sprint.",
    ],
  },
  sound: {
    eyebrow: "Sound start",
    title: "Start with the sound world.",
    subtitle:
      "Use this path when room tone, foley, dialogue space, silence, or effects need planning.",
    steps: [
      "Create a project shell around sound notes.",
      "Paste room tone, effects, foley, dialogue, and mix references.",
      "Open the sound map room and organize the audio handoff.",
    ],
  },
  production: {
    eyebrow: "Production start",
    title: "Start with production needs.",
    subtitle:
      "Use this path when you already have assets, checklists, prompt needs, or a production plan.",
    steps: [
      "Create a project shell around the production notes.",
      "Paste asset needs, prompts, insert shots, or checklist items.",
      "Open the production room and organize the packet.",
    ],
  },
  shotlist: {
    eyebrow: "Shot list start",
    title: "Start with the shots.",
    subtitle:
      "Use this path when coverage, inserts, camera intent, or shot order is already forming.",
    steps: [
      "Create a project shell around the shot notes.",
      "Paste shot numbers, coverage, inserts, and camera movement.",
      "Open the production room and turn shots into prompt-ready assets.",
    ],
  },
  prompts: {
    eyebrow: "Prompt card start",
    title: "Start with prompts from your workflow.",
    subtitle:
      "Use this path when you already have image, animation, sound, or negative prompts from another tool.",
    steps: [
      "Create a project shell around the prompt material.",
      "Paste prompt drafts, tool notes, or negative prompt rules.",
      "Open the production room and organize prompts into packet cards.",
    ],
  },
  packet: {
    eyebrow: "Packet start",
    title: "Start with a packet in progress.",
    subtitle:
      "Use this path when you already have a checklist, plan, or production packet draft.",
    steps: [
      "Create a project shell around the packet draft.",
      "Paste checklist items, assets, shot notes, or handoff notes.",
      "Open the production room and shape the export-ready packet.",
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
    <main className="app-shell command-app-shell">
      <AuthReturnHandler fallbackNext={`/app/start/${startMode}`} quiet />
      <header className="app-topbar command-topbar">
        <a className="brand-link" href="/app">
          Back to Guide
        </a>
        <nav aria-label="Start flow navigation">
          <a href="/">Landing</a>
          <a href="/app">App Home</a>
          <a href="/support">Support</a>
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
