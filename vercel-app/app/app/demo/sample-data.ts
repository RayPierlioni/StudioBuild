import type {
  AccessEntitlement,
  ProductionAsset,
  Project,
  ProjectDocument,
  SceneBreakdown,
} from "../../studio-workspace";

const createdAt = "2026-05-08T12:00:00.000Z";

export const demoEntitlement: AccessEntitlement = {
  isAdmin: false,
  isPro: true,
  planLabel: "Founder Pro",
  status: "demo",
};

export const demoProject: Project = {
  id: "demo-signal-house",
  title: "Signal House",
  genre: "Contained sci-fi mystery",
  tone: "Elegant, tense, intimate, human",
  logline:
    "After a grieving sound archivist hears her dead brother inside a forbidden emergency broadcast, she breaks into an abandoned relay station and discovers the signal is teaching machines how to imitate the living.",
  inspirations: ["Arrival", "The Vast of Night", "Ex Machina", "Aftersun"],
  active_stage: "breakdown",
  notes: "Public MiseForge sample project.",
  created_at: createdAt,
  updated_at: createdAt,
};

export const demoDocuments = [
  {
    id: "demo-doc-idea",
    doc_type: "idea",
    content: `# Logline Lab

Protagonist: Mara Vale, a sound archivist who catalogues disaster recordings for a private memory company.

Want: prove the strange voice in a sealed emergency broadcast is really her missing brother.

Need: accept that grief makes imitation feel like evidence.

Obstacle: the relay station is owned by the company that trained its archival AI on private family recordings.

Hook: every time Mara plays the signal, it learns a little more of her brother's voice.`,
    created_at: createdAt,
    updated_at: createdAt,
  },
  {
    id: "demo-doc-treatment",
    doc_type: "treatment",
    content: `# Treatment Blueprint

Signal House is a contained sci-fi mystery about grief, authorship, and the emotional danger of perfect imitation.

Act I opens with Mara restoring damaged emergency tapes in a quiet archive. She hears Jonah, her vanished brother, inside a broadcast that should contain only static. The line is too personal to be a coincidence: "Do not let them teach the room my name."

Act II moves Mara and her former partner Ellis into the abandoned relay station where the signal originated. Every room contains old analog equipment wired into new machine-learning hardware. The station behaves like a memory palace, pulling fragments from Mara's past and turning them into instructions.

Act III forces Mara to choose between preserving the imitation and destroying the system that made it. The climax is not a battle with a machine. It is a sound decision: leave the final tape blank, or let the voice become public proof that her brother is gone.`,
    created_at: createdAt,
    updated_at: createdAt,
  },
  {
    id: "demo-doc-character",
    doc_type: "character_bible",
    content: `# Character Bible

## Mara Vale
Visual anchor: late 30s, tired precision, short dark hair tucked behind one ear, olive field jacket, small silver recorder on a worn strap.
Voice: clipped and practical until grief breaks the rhythm. She avoids saying "I miss him" and instead talks about signal loss.
Continuity: always carries the recorder; jacket gets wet after Scene 2 and stays damp in Scene 3.

## Ellis Rook
Visual anchor: early 40s, careful posture, wool coat, soft eyes, field notebook, wedding ring he never discusses.
Voice: gentle pressure, questions that sound like warnings.
Continuity: keeps a flashlight in left hand after entering the relay station.

## Jonah Vale
Visual anchor: never fully seen in present time. Appears as a voice, old photo, and warped monitor reflection.
Voice: warm, teasing, then increasingly precise and machine-like.
Continuity: his voice should never become too clean until the final transmission.`,
    created_at: createdAt,
    updated_at: createdAt,
  },
  {
    id: "demo-doc-location",
    doc_type: "location_bible",
    content: `# Location Bible

## Relay Station
Layout: low concrete building on a coastal hill. Front room with dead switchboard. Long hall. Recording chamber. Roof antenna access.
Lighting: cold practical fluorescents, storm flashes, monitor glow, handheld flashlight.
Color: wet graphite, faded sea green, amber tape labels.
Sound: wind pressure, cable hum, relay clicks, distant surf, tape hiss.
Continuity risk: water enters through the ceiling after Scene 2. Keep floor reflections and wet coat continuity.

## Archive Booth
Layout: glass listening booth, waveform monitor, archival shelves, desk lamp.
Lighting: warm desk pool against a dark room.
Sound: headphones leak, HVAC, low tape transport.`,
    created_at: createdAt,
    updated_at: createdAt,
  },
  {
    id: "demo-doc-lookbook",
    doc_type: "look_book",
    content: `# Visual Look Book

Palette: charcoal, sea green, oxidized copper, warm amber tape labels, off-white paper.
Camera grammar: controlled locked frames until the signal becomes personal; then slow push-ins and restrained handheld.
Lens feel: slight compression, shallow focus on tape objects, reflective surfaces used for partial faces.
Motifs: reels turning, blinking red LEDs, water on concrete, handwriting on tape boxes, mouths obscured by equipment.
Negative prompt rule: no glossy sci-fi lab, no neon cyberpunk, no heroic control rooms, no extra characters.`,
    created_at: createdAt,
    updated_at: createdAt,
  },
  {
    id: "demo-doc-script",
    doc_type: "script",
    content: `INT. ARCHIVE BOOTH - NIGHT

Mara listens to a damaged emergency tape. Under the static, Jonah's voice appears for one impossible second.

JONAH (V.O.)
Do not let them teach the room my name.

Mara freezes. The tape counter keeps moving.

INT. RELAY STATION - NIGHT

Mara and Ellis enter with flashlights. Water ticks from the ceiling into a metal dish. A dead switchboard clicks once.

ELLIS
Tell me this is only a recording.

MARA
It waited until I was alone.

INT. RECORDING CHAMBER - PRE-DAWN

The machine plays Jonah's voice back in Mara's exact breathing rhythm. Mara places a blank reel on the deck.

MARA
If you are him, forgive me.

She presses record over the voice.`,
    created_at: createdAt,
    updated_at: createdAt,
  },
  {
    id: "demo-doc-dialogue",
    doc_type: "dialogue_notes",
    content: `# AI Voice Scanner

Dialogue discipline score: 86%

Strength: the characters avoid explaining the premise directly.

Risk: Ellis can become a question machine if every line is only concern. Give him one specific behavior: he checks exits before asking anything emotional.

Rewrite rule: when Mara is afraid, she names equipment instead of emotion.`,
    created_at: createdAt,
    updated_at: createdAt,
  },
  {
    id: "demo-doc-continuity",
    doc_type: "continuity_tracker",
    content: `# Continuity Tracker

- Mara's silver recorder appears in every scene and is clipped to her strap.
- Ellis carries flashlight left-handed from Scene 2 onward.
- Water drip begins in Scene 2 and becomes a puddle by Scene 3.
- Jonah's voice moves from damaged and distant to clean and intimate.
- No score until the end. Let room tone and tape mechanics carry tension.`,
    created_at: createdAt,
    updated_at: createdAt,
  },
  {
    id: "demo-doc-schedule",
    doc_type: "production_schedule",
    content: `# Production Schedule

1. Lock character anchors for Mara and Ellis.
2. Generate relay station establishing stills.
3. Generate archive booth insert stills.
4. Build Scene 2 coverage before any insert variations.
5. Generate image prompts from approved shot rows.
6. Generate animation plus sound prompts only after stills are approved.
7. Export premium production packet for the full short.`,
    created_at: createdAt,
    updated_at: createdAt,
  },
  {
    id: "demo-doc-sound",
    doc_type: "sound_map",
    content: `# Sound Design Map

No music unless the final blank reel moment needs a barely audible tonal bed.

Archive Booth: headphone leak, tape transport, old HVAC, Mara's breath close to the mic.
Relay Station: wind pressure, cable slap, water ticks, switchboard click, flashlight handling.
Recording Chamber: reel motor, voice flutter, room tone narrowing as the machine learns Mara's breathing.`,
    created_at: createdAt,
    updated_at: createdAt,
  },
] satisfies ProjectDocument[];

export const demoSceneBreakdowns = [
  {
    id: "demo-scene-1",
    scene_number: 1,
    scene_heading: "INT. ARCHIVE BOOTH - NIGHT",
    location: "Archive Booth",
    time_of_day: "Night",
    summary:
      "Mara discovers Jonah's voice inside a sealed emergency tape and realizes the recording is responding to her.",
    characters: ["Mara Vale", "Jonah Vale"],
    props: ["silver recorder", "emergency tape", "headphones", "waveform monitor", "desk lamp"],
    wardrobe: ["Mara olive field jacket", "black archival gloves"],
    makeup_hair: ["tired eyes", "short dark hair tucked behind one ear"],
    set_dressing: ["glass listening booth", "archival shelves", "paper tape labels", "warm desk pool"],
    vehicles: [],
    sound_notes:
      "Tape hiss, headphone bleed, HVAC, one impossible clean syllable from Jonah. No music.",
    color_palette: "Warm amber desk light against charcoal archive darkness.",
    blocking:
      "Mara leans toward the waveform monitor, removes one headphone cup, then stops breathing when the voice says her name.",
    tone: "Controlled dread, intimate grief, forensic focus",
    created_at: createdAt,
    updated_at: createdAt,
  },
  {
    id: "demo-scene-2",
    scene_number: 2,
    scene_heading: "INT. RELAY STATION - NIGHT",
    location: "Relay Station",
    time_of_day: "Night",
    summary:
      "Mara and Ellis enter the abandoned relay station and the building answers with a mechanical click timed to Mara's recorder.",
    characters: ["Mara Vale", "Ellis Rook"],
    props: ["flashlight", "silver recorder", "switchboard", "metal dish", "field notebook"],
    wardrobe: ["Mara damp olive field jacket", "Ellis wool coat"],
    makeup_hair: ["rain on hair", "cold breath"],
    set_dressing: ["wet concrete floor", "dead switchboard", "hanging cables", "ceiling leak"],
    vehicles: [],
    sound_notes:
      "Wind pressure, water ticks into metal dish, cable hum, switchboard click. No score.",
    color_palette: "Sea green shadows, storm flashes, oxidized copper hardware.",
    blocking:
      "Ellis checks the exit while Mara crosses to the switchboard; the recorder light blinks before the board clicks.",
    tone: "Tense, procedural, haunted but grounded",
    created_at: createdAt,
    updated_at: createdAt,
  },
  {
    id: "demo-scene-3",
    scene_number: 3,
    scene_heading: "INT. RECORDING CHAMBER - PRE-DAWN",
    location: "Recording Chamber",
    time_of_day: "Pre-dawn",
    summary:
      "Mara chooses to record silence over the perfect imitation of Jonah, destroying proof in order to protect the truth.",
    characters: ["Mara Vale", "Jonah Vale", "Ellis Rook"],
    props: ["blank reel", "reel deck", "silver recorder", "red record button", "tape box"],
    wardrobe: ["Mara damp olive field jacket", "Ellis wool coat"],
    makeup_hair: ["Mara tear track, restrained", "Ellis rain-damp hair"],
    set_dressing: ["recording chamber", "reel machine", "monitor reflection", "water puddle"],
    vehicles: [],
    sound_notes:
      "Reel motor, voice flutter, room tone tightening, red button click, then blank tape hiss.",
    color_palette: "Cold pre-dawn blue with a single red record light.",
    blocking:
      "Mara places the blank reel with both hands; Ellis stays behind her; Jonah's voice syncs with her breathing before she presses record.",
    tone: "Heartbreak under restraint, moral decision, quiet release",
    created_at: createdAt,
    updated_at: createdAt,
  },
] satisfies SceneBreakdown[];

export const demoProductionAssets = [
  {
    id: "demo-shot-1-1",
    project_id: demoProject.id,
    scene_breakdown_id: "demo-scene-1",
    owner_id: "demo",
    order_index: 1,
    asset_type: "shot",
    name: "Shot 1: Archive booth isolation",
    purpose: "Establish Mara alone inside a precise, quiet archive space.",
    visual: "Wide locked frame through glass, Mara small under warm desk light.",
    image_prompt:
      "Cinematic still, glass archive listening booth at night, lone sound archivist in olive field jacket, warm desk lamp, dark shelves, waveform monitor glow, shallow reflections, restrained sci-fi realism.",
    animation_prompt:
      "Slow imperceptible push through glass toward Mara as tape reels turn; keep frame controlled and quiet, no extra characters.",
    sound_prompt:
      "Old HVAC, faint headphone leak, tape transport, soft chair creak, no music.",
    notes:
      "shotType=Wide; angle=Through glass; movement=Slow push; lens=50mm compressed reflections; duration=6 sec; action=Mara listens alone; dialogueSound=No dialogue, tape hiss; continuity=Recorder visible on strap.",
    created_at: createdAt,
    updated_at: createdAt,
  },
  {
    id: "demo-shot-1-2",
    project_id: demoProject.id,
    scene_breakdown_id: "demo-scene-1",
    owner_id: "demo",
    order_index: 2,
    asset_type: "insert_shot",
    name: "Insert: waveform spike",
    purpose: "Make Jonah's impossible voice visible without exposition.",
    visual: "Close insert on waveform monitor as a clean spike cuts through static.",
    image_prompt:
      "Extreme close-up of analog-digital waveform monitor, clean signal spike inside noisy static, amber tape label reflected on screen, dark archive booth, cinematic macro detail.",
    animation_prompt:
      "Animate waveform crawling with static, then one clean spike arrives exactly on the voice; subtle monitor flicker only.",
    sound_prompt:
      "Tape hiss drops for one syllable, then returns. No score.",
    notes:
      "shotType=ECU insert; angle=Straight-on screen; movement=None; lens=Macro; duration=3 sec; action=Waveform spike appears; dialogueSound=Jonah voice fragment; continuity=Same monitor and desk lamp reflection.",
    created_at: createdAt,
    updated_at: createdAt,
  },
  {
    id: "demo-shot-2-1",
    project_id: demoProject.id,
    scene_breakdown_id: "demo-scene-2",
    owner_id: "demo",
    order_index: 1,
    asset_type: "shot",
    name: "Shot 1: Relay station threshold",
    purpose: "Show the station as a real physical problem before it becomes a mystery.",
    visual: "Mara and Ellis entering with flashlights through rain, wet concrete and dead switchboard ahead.",
    image_prompt:
      "Contained sci-fi mystery still, abandoned coastal relay station interior, wet concrete floor, dead switchboard, two adults with flashlights, olive field jacket and wool coat, sea green shadows, practical storm light.",
    animation_prompt:
      "Handheld restrained entry, flashlights sweep once across dead switchboard, water drips into metal dish, no sudden horror movement.",
    sound_prompt:
      "Wind pressure outside, cable hum, water ticks into metal dish, flashlight grip, no music.",
    notes:
      "shotType=Medium wide; angle=Low threshold; movement=Slow handheld follow; lens=35mm; duration=7 sec; action=They enter and stop; dialogueSound=Room tone before Ellis speaks; continuity=Mara recorder blinking.",
    created_at: createdAt,
    updated_at: createdAt,
  },
  {
    id: "demo-shot-2-2",
    project_id: demoProject.id,
    scene_breakdown_id: "demo-scene-2",
    owner_id: "demo",
    order_index: 2,
    asset_type: "insert_shot",
    name: "Insert: switchboard click",
    purpose: "Externalize the signal answering Mara.",
    visual: "Close insert of one dead switchboard toggle clicking by itself as Mara's recorder light blinks.",
    image_prompt:
      "Macro insert, old relay station switchboard toggle, oxidized copper, red recorder light reflected in wet metal, dark sea green shadows, cinematic texture.",
    animation_prompt:
      "Toggle clicks once by itself, recorder red light blinks in sync, tiny vibration in hanging cables; keep motion grounded.",
    sound_prompt:
      "Sharp switch click, recorder electrical tick, water drip continues underneath.",
    notes:
      "shotType=Insert; angle=Tight profile; movement=Locked; lens=Macro; duration=2 sec; action=Toggle clicks; dialogueSound=No dialogue; continuity=Recorder light timing matches previous shot.",
    created_at: createdAt,
    updated_at: createdAt,
  },
  {
    id: "demo-shot-3-1",
    project_id: demoProject.id,
    scene_breakdown_id: "demo-scene-3",
    owner_id: "demo",
    order_index: 1,
    asset_type: "shot",
    name: "Shot 1: Blank reel decision",
    purpose: "Make the climax a physical action instead of an explanation.",
    visual: "Mara places a blank reel on the deck while Jonah's voice plays in her breathing rhythm.",
    image_prompt:
      "Cinematic close medium, woman in damp olive field jacket placing blank reel on old reel deck, pre-dawn blue light, red record button, restrained grief, recording chamber, realistic texture.",
    animation_prompt:
      "Slow controlled hand movement as Mara seats the blank reel; red record button glows; her breath steadies before pressing record.",
    sound_prompt:
      "Reel motor, voice flutter synced with breath, small plastic reel click, no music.",
    notes:
      "shotType=Close medium; angle=Table height; movement=Slow push; lens=50mm; duration=8 sec; action=Mara places blank reel; dialogueSound=Jonah voice under breath; continuity=Mara jacket still damp.",
    created_at: createdAt,
    updated_at: createdAt,
  },
  {
    id: "demo-shot-3-2",
    project_id: demoProject.id,
    scene_breakdown_id: "demo-scene-3",
    owner_id: "demo",
    order_index: 2,
    asset_type: "insert_shot",
    name: "Insert: red record button",
    purpose: "Turn Mara's moral choice into one irreversible image.",
    visual: "Extreme close-up of Mara's finger pressing the red record button.",
    image_prompt:
      "Extreme close-up, human finger pressing red record button on old reel machine, cold blue pre-dawn light, tiny water reflection, tactile plastic, cinematic restraint.",
    animation_prompt:
      "Finger hesitates, presses red record button, button depresses with soft mechanical resistance; cut after click.",
    sound_prompt:
      "Button click, reel motor drops into blank hiss, breath catches, no music.",
    notes:
      "shotType=ECU insert; angle=Top-side macro; movement=Locked; lens=Macro; duration=3 sec; action=Button press; dialogueSound=Mara whispers if you are him forgive me over the insert; continuity=Same reel deck and red light.",
    created_at: createdAt,
    updated_at: createdAt,
  },
] satisfies ProductionAsset[];
