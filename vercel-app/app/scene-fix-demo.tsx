"use client";

import { useMemo, useState } from "react";

import { buildScenePrompt, parseScript } from "../lib/script-parser";

const sampleScene = `INT. TEST ROOM - NIGHT

MARA
This scene needs a better second beat.

JONAH
Then we should stop protecting it.`;

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
    () => buildScenePrompt(activeScene, toolStack),
    [activeScene, toolStack],
  );
  const topMissing = parsed.missingItems.slice(0, 5);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(compiledPrompt);
      setCopyStatus("Expert scene plan copied.");
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
            StudioBuild reads the scene like a production-minded script supervisor: it finds what is
            missing, maps the production problem, and turns the next step into a usable scene plan.
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
          <span>Scene-to-production guidance</span>
        </div>
        <textarea readOnly value={compiledPrompt} />
        <div className="actions">
          <button className="button" type="button" onClick={copyPrompt}>
            Copy Expert Prompt
          </button>
          <a className="button secondary" href="#workspace">
            Open StudioBuild Workspace
          </a>
        </div>
        {copyStatus ? <p className="status success">{copyStatus}</p> : null}
      </div>
    </article>
  );
}
