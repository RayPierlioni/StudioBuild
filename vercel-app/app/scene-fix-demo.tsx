"use client";

import { useMemo, useState } from "react";

type ParsedScene = {
  heading: string;
  body: string;
  location: string;
  timeOfDay: string;
  characters: string[];
  dialogueBlocks: number;
};

const sampleScene = `INT. TEST ROOM - NIGHT

MARA
This scene needs a better second beat.

JONAH
Then we should stop protecting it.`;

const sceneHeadingPattern = /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.|EST\.)\s+/i;
const transitionPattern = /^(FADE OUT|FADE IN|CUT TO|DISSOLVE TO|SMASH CUT TO|MATCH CUT TO):?$/i;

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function parseHeading(heading: string) {
  const cleanHeading = heading.replace(sceneHeadingPattern, "").trim();
  const parts = cleanHeading.split(/\s+-\s+/);
  const location = parts[0]?.trim() || "Unlabeled location";
  const timeOfDay = parts.slice(1).join(" - ").trim() || "Unspecified";

  return { location, timeOfDay };
}

function isCharacterCue(line: string) {
  const trimmed = line.trim();

  if (!trimmed || trimmed.length > 34) {
    return false;
  }

  if (sceneHeadingPattern.test(trimmed) || transitionPattern.test(trimmed)) {
    return false;
  }

  return /^[A-Z0-9 .'"()_-]+$/.test(trimmed) && /[A-Z]/.test(trimmed);
}

function parseScript(input: string) {
  const lines = input.replace(/\r/g, "").split("\n");
  const scenes: Array<{ heading: string; lines: string[] }> = [];
  let currentScene: { heading: string; lines: string[] } | null = null;
  const preface: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (sceneHeadingPattern.test(line.trim())) {
      if (currentScene) {
        scenes.push(currentScene);
      }

      currentScene = { heading: line.trim(), lines: [] };
      continue;
    }

    if (currentScene) {
      currentScene.lines.push(line);
    } else {
      preface.push(line);
    }
  }

  if (currentScene) {
    scenes.push(currentScene);
  }

  if (!scenes.length) {
    scenes.push({
      heading: "UNLABELED SCENE",
      lines: preface.length ? preface : lines,
    });
  }

  const parsedScenes: ParsedScene[] = scenes.map((scene) => {
    const body = scene.lines.join("\n").trim();
    const characters = unique(scene.lines.filter(isCharacterCue));
    const { location, timeOfDay } = parseHeading(scene.heading);

    return {
      heading: scene.heading,
      body,
      location,
      timeOfDay,
      characters,
      dialogueBlocks: characters.length
        ? scene.lines.filter(isCharacterCue).length
        : body.split(/\n{2,}/).filter(Boolean).length,
    };
  });

  const allCharacters = unique(parsedScenes.flatMap((scene) => scene.characters));
  const allLocations = unique(parsedScenes.map((scene) => scene.location));
  const nightScenes = parsedScenes.filter((scene) => /night|evening|dusk|dawn/i.test(scene.timeOfDay)).length;
  const dialogueBlocks = parsedScenes.reduce((total, scene) => total + scene.dialogueBlocks, 0);
  const hasProductionNotes = /props?|wardrobe|sound|shot|prompt|continuity|blocking|insert/i.test(input);
  const missingItems = [
    "scene purpose",
    "visual beat",
    "props",
    "wardrobe continuity",
    "sound notes",
    "insert shot",
    "image prompt",
    "animation prompt",
  ].filter((item) => !new RegExp(item.split(" ")[0], "i").test(input));
  const readinessScore = Math.max(
    24,
    Math.min(
      78,
      24 +
        parsedScenes.length * 7 +
        allCharacters.length * 5 +
        allLocations.length * 5 +
        dialogueBlocks * 2 +
        (hasProductionNotes ? 14 : 0) -
        missingItems.length * 3,
    ),
  );

  return {
    scenes: parsedScenes,
    characters: allCharacters,
    locations: allLocations,
    nightScenes,
    dialogueBlocks,
    missingItems,
    readinessScore,
  };
}

function buildPrompt(scene: ParsedScene, toolStack: string) {
  return `You are a script supervisor and AI film production coordinator.

Analyze this scene for an AI filmmaker. Do not write generic advice. Return a practical scene packet with:

1. Scene purpose
2. Emotional turn
3. What feels generic or robotic
4. A stronger cinematic rewrite
5. Characters present
6. Required props
7. Wardrobe continuity
8. Location and lighting needs
9. Sound design notes, no music unless story-necessary
10. Insert shot suggestion
11. Image generation prompt
12. Animation prompt
13. Continuity risks
14. Next best production action

Creator workflow/tools:
${toolStack || "Tool stack not specified. Keep prompts adaptable to Midjourney, Runway, Kling, Luma, Pika, ElevenLabs, Premiere, Final Cut, and DaVinci Resolve."}

Scene:
${scene.heading}

${scene.body}`;
}

export function SceneFixDemo() {
  const [sceneText, setSceneText] = useState(sampleScene);
  const [toolStack, setToolStack] = useState("Image: Midjourney. Animation: Runway. Sound: ElevenLabs. Edit: Premiere.");
  const [copyStatus, setCopyStatus] = useState("");
  const parsed = useMemo(() => parseScript(sceneText), [sceneText]);
  const activeScene = parsed.scenes[0] ?? {
    heading: "UNLABELED SCENE",
    body: sceneText,
    location: "Unlabeled location",
    timeOfDay: "Unspecified",
    characters: [],
    dialogueBlocks: 0,
  };
  const compiledPrompt = useMemo(
    () => buildPrompt(activeScene, toolStack),
    [activeScene, toolStack],
  );
  const topMissing = parsed.missingItems.slice(0, 5);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(compiledPrompt);
      setCopyStatus("Prompt copied. Paste it into ChatGPT, Claude, Gemini, or your preferred model.");
    } catch {
      setCopyStatus("Copy failed. Select the prompt text and copy it manually.");
    }
  }

  return (
    <article className="panel scene-demo" id="fix-scene">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Fix a Scene Free</p>
          <h2>Paste a rough scene. Leave with a production plan.</h2>
          <p>
            StudioBuild can create value before hosted AI fires: parse the scene, map the
            production problem, and compile the exact expert prompt for your own AI workflow.
          </p>
        </div>
      </div>

      <div className="demo-grid">
        <section className="demo-input">
          <label>
            Scene or script fragment
            <textarea
              value={sceneText}
              onChange={(event) => {
                setSceneText(event.target.value);
                setCopyStatus("");
              }}
            />
          </label>
          <label>
            Your tool stack
            <input
              value={toolStack}
              onChange={(event) => setToolStack(event.target.value)}
              placeholder="Image: Midjourney. Animation: Runway. Sound: ElevenLabs."
            />
          </label>
        </section>

        <section className="demo-output" aria-label="Scene analysis">
          <div className="score-card">
            <span>Production readiness</span>
            <strong>{parsed.readinessScore}%</strong>
            <p>
              Missing: {topMissing.length ? topMissing.join(", ") : "ready for a packet pass"}.
            </p>
          </div>

          <div className="metrics-grid">
            <div>
              <span>Scenes</span>
              <strong>{parsed.scenes.length}</strong>
            </div>
            <div>
              <span>Characters</span>
              <strong>{parsed.characters.length || "?"}</strong>
            </div>
            <div>
              <span>Locations</span>
              <strong>{parsed.locations.length || "?"}</strong>
            </div>
            <div>
              <span>Night scenes</span>
              <strong>{parsed.nightScenes}</strong>
            </div>
          </div>

          <div className="scene-findings">
            <h3>{activeScene.heading}</h3>
            <p>
              {activeScene.characters.length
                ? `Detected speaking characters: ${activeScene.characters.join(", ")}.`
                : "No clear speaking characters detected yet."}
            </p>
            <p>
              Next best action: build a scene packet with purpose, emotional turn, continuity,
              insert shot, and prompt cards.
            </p>
          </div>
        </section>
      </div>

      <div className="prompt-compiler">
        <div className="tool-heading">
          <h3>Prompt Compiler</h3>
          <span>No hosted AI cost</span>
        </div>
        <textarea readOnly value={compiledPrompt} />
        <div className="actions">
          <button className="button" type="button" onClick={copyPrompt}>
            Copy Expert Prompt
          </button>
          <a className="button secondary" href="#workspace">
            Use StudioBuild AI - 3 credits
          </a>
        </div>
        {copyStatus ? <p className="status success">{copyStatus}</p> : null}
      </div>
    </article>
  );
}
