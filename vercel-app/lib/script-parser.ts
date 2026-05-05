export type ParsedScene = {
  heading: string;
  body: string;
  location: string;
  timeOfDay: string;
  characters: string[];
  dialogueBlocks: number;
};

export type ParsedScript = {
  scenes: ParsedScene[];
  characters: string[];
  locations: string[];
  nightScenes: number;
  dialogueBlocks: number;
  missingItems: string[];
  readinessScore: number;
};

export type ScenePacket = {
  sceneNumber: number;
  heading: string;
  location: string;
  timeOfDay: string;
  summary: string;
  characters: string[];
  props: string[];
  wardrobe: string[];
  makeupHair: string[];
  setDressing: string[];
  vehicles: string[];
  soundNotes: string;
  colorPalette: string;
  blocking: string;
  tone: string;
  prompt: string;
  nextBestAction: string;
};

export type ScenePacketOptions = {
  projectTone?: string;
  toolStack?: string;
};

const sceneHeadingPattern = /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.|EST\.)\s+/i;
const transitionPattern = /^(FADE OUT|FADE IN|CUT TO|DISSOLVE TO|SMASH CUT TO|MATCH CUT TO):?$/i;

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function splitProductionList(value: string) {
  return unique(
    value
      .split(/[,;|]/)
      .map((item) => item.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean),
  ).slice(0, 16);
}

function extractKeywordList(body: string, keywords: string[]) {
  const lines = body.replace(/\r/g, "").split("\n");
  const matches: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    for (const keyword of keywords) {
      const pattern = new RegExp(`^${keyword}\\s*:\\s*(.+)$`, "i");
      const match = trimmed.match(pattern);

      if (match?.[1]) {
        matches.push(...splitProductionList(match[1]));
      }
    }
  }

  return unique(matches);
}

function extractLikelyProps(body: string) {
  const propWords = [
    "bag",
    "book",
    "box",
    "camera",
    "card",
    "car",
    "case",
    "coffee",
    "computer",
    "door",
    "envelope",
    "folder",
    "glass",
    "gun",
    "key",
    "knife",
    "lamp",
    "letter",
    "mask",
    "phone",
    "photo",
    "recorder",
    "screen",
    "table",
    "watch",
  ];
  const found = propWords.filter((word) => new RegExp(`\\b${word}s?\\b`, "i").test(body));

  return unique(found.map((word) => word.replace(/\b\w/g, (letter) => letter.toUpperCase()))).slice(0, 12);
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

export function parseScript(input: string): ParsedScript {
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

export function buildScenePrompt(scene: ParsedScene, toolStack: string) {
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

function firstMeaningfulLine(body: string) {
  return (
    body
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line && !isCharacterCue(line) && !transitionPattern.test(line)) || ""
  );
}

function summarizeScene(scene: ParsedScene, sceneNumber: number) {
  const cast = scene.characters.length ? scene.characters.join(", ") : "the characters";
  const firstAction = firstMeaningfulLine(scene.body);

  if (firstAction) {
    return `Scene ${sceneNumber} places ${cast} in ${scene.location}. Opening action: ${firstAction}`;
  }

  return `Scene ${sceneNumber} places ${cast} in ${scene.location}. Define the dramatic purpose, emotional turn, and production needs before generating shots.`;
}

function deriveSoundNotes(scene: ParsedScene) {
  const explicitSound = extractKeywordList(scene.body, ["sound", "sound design", "audio"]);

  if (explicitSound.length) {
    return explicitSound.join(", ");
  }

  if (/night|dusk|dawn|evening/i.test(scene.timeOfDay)) {
    return "Build room tone, distant exterior texture, close physical sounds, and no music unless the story requires it.";
  }

  return "Capture location tone, character movement, prop handling, and no music unless the story requires it.";
}

function derivePalette(scene: ParsedScene, projectTone: string) {
  const tone = projectTone.trim();

  if (/night|dusk|dawn|evening/i.test(scene.timeOfDay)) {
    return tone
      ? `${tone}; soft contrast, controlled shadows, practical light motivation.`
      : "Soft contrast, controlled shadows, practical light motivation.";
  }

  return tone
    ? `${tone}; restrained color, clean continuity references, natural light motivation.`
    : "Restrained color, clean continuity references, natural light motivation.";
}

function deriveBlocking(scene: ParsedScene) {
  const explicitBlocking = extractKeywordList(scene.body, ["blocking", "movement"]);

  if (explicitBlocking.length) {
    return explicitBlocking.join(", ");
  }

  return "Map entrances, exits, eyelines, distance shifts, and one visual action that carries the emotional turn.";
}

export function buildScenePacket(
  scene: ParsedScene,
  sceneNumber: number,
  options: ScenePacketOptions = {},
): ScenePacket {
  const props = unique([
    ...extractKeywordList(scene.body, ["props?", "prop list", "objects"]),
    ...extractLikelyProps(scene.body),
  ]);
  const wardrobe = extractKeywordList(scene.body, ["wardrobe", "costume", "clothing"]);
  const makeupHair = extractKeywordList(scene.body, ["makeup", "hair", "makeup/hair"]);
  const setDressing = unique([
    ...extractKeywordList(scene.body, ["set dressing", "set", "location dressing"]),
    scene.location !== "Unlabeled location" ? scene.location : "",
  ]).slice(0, 12);
  const vehicles = extractKeywordList(scene.body, ["vehicles?", "cars?"]);
  const tone = options.projectTone?.trim() || "Needs tone pass";

  return {
    sceneNumber,
    heading: scene.heading,
    location: scene.location,
    timeOfDay: scene.timeOfDay,
    summary: summarizeScene(scene, sceneNumber),
    characters: scene.characters,
    props,
    wardrobe,
    makeupHair,
    setDressing,
    vehicles,
    soundNotes: deriveSoundNotes(scene),
    colorPalette: derivePalette(scene, tone),
    blocking: deriveBlocking(scene),
    tone,
    prompt: buildScenePrompt(scene, options.toolStack || ""),
    nextBestAction:
      "Fill scene purpose, emotional turn, continuity risks, insert shot, image prompt, and animation prompt.",
  };
}

function listOrEmpty(values: string[]) {
  return values.length ? values.join(", ") : "Not filled yet";
}

export function buildScenePacketDocument(
  parsed: ParsedScript,
  packets: ScenePacket[],
  options: ScenePacketOptions = {},
) {
  const toolStack = options.toolStack?.trim() || "Tool stack not specified";
  const lines = [
    "# StudioBuild Scene Packet",
    "",
    `Production readiness: ${parsed.readinessScore}%`,
    `Scenes: ${parsed.scenes.length}`,
    `Characters: ${parsed.characters.length ? parsed.characters.join(", ") : "Not detected yet"}`,
    `Locations: ${parsed.locations.length ? parsed.locations.join(", ") : "Not detected yet"}`,
    `Missing next: ${parsed.missingItems.length ? parsed.missingItems.join(", ") : "Ready for a deeper packet pass"}`,
    `Workflow/tools: ${toolStack}`,
    "",
    "## Parsed Scene Breakdowns",
  ];

  for (const packet of packets) {
    lines.push(
      "",
      `### Scene ${packet.sceneNumber}: ${packet.heading}`,
      "",
      `Summary: ${packet.summary}`,
      `Location: ${packet.location}`,
      `Time of day: ${packet.timeOfDay}`,
      `Characters: ${listOrEmpty(packet.characters)}`,
      `Props: ${listOrEmpty(packet.props)}`,
      `Wardrobe: ${listOrEmpty(packet.wardrobe)}`,
      `Set dressing: ${listOrEmpty(packet.setDressing)}`,
      `Sound: ${packet.soundNotes}`,
      `Color/feel: ${packet.colorPalette}`,
      `Blocking: ${packet.blocking}`,
      `Next best action: ${packet.nextBestAction}`,
      "",
      "#### Expert Prompt",
      "",
      "```text",
      packet.prompt,
      "```",
    );
  }

  return lines.join("\n");
}
