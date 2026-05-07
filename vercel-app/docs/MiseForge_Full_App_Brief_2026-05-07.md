# MiseForge Full App Brief

Date: May 7, 2026

Live site: https://miseforge.com/

App entry: https://miseforge.com/app

Admin email: rpierlioni@gmail.com

## Executive Summary

MiseForge is a workflow-first pre-production command center for AI filmmakers. The core thesis is that AI visuals are becoming easier to generate, but serious AI films still fail when story logic, continuity, scene purpose, shot planning, production assets, and sound design are weak. MiseForge is designed to fill that gap.

The product should not be judged as a generic AI writing app. The intended value is a film-building system: it helps a filmmaker move from rough idea, script, or single scene into a structured production workspace with bibles, scene packets, shot lists, prompt cards, continuity tracking, production order, sound maps, and exportable packets.

The current build is no longer just a landing page and a textarea. It now includes a real app shell, Google sign-in, Supabase-backed project saves, pricing gates, admin access, Stripe checkout/portal/webhook setup, several workflow modules, a guide assistant, and premium export direction.

## Product Positioning

Best short positioning:

MiseForge turns rough AI film ideas and scripts into production-ready story, scene, shot, sound, continuity, and prompt systems.

Audience:

- AI filmmakers making shorts, festival pieces, proof-of-concept scenes, trailers, and spec films.
- New filmmakers who did not go to film school and need workflow discipline.
- Creators who can generate visuals but struggle with story, continuity, planning, and production order.
- Filmmakers using external tools such as Midjourney, Runway, Kling, Luma, Pika, ElevenLabs, Premiere, Final Cut, and DaVinci Resolve.

Primary promise:

MiseForge helps the user build the film before generating the shots.

## Current Pricing Direction

The app has moved away from weekly billing language and now points toward a more standard creator SaaS model:

- Free: one project, a real start, one scene-packet preview, prompt copying, and basic Markdown export.
- Founder Pro: $12.99/month for multiple projects, full workflow depth, bibles, shot lists, production schedule, sound maps, version history, prompt cards, and premium PDF packet export.
- Project Pass: $9/project as a potential one-film purchase path.

Admin users receive full access for testing and development without needing an active paid subscription.

## AI Strategy

MiseForge is intentionally being built to deliver value without hosted API calls at launch.

The current strategy is:

- Workflow first.
- Prompt compiler second.
- Hosted AI later, only after users are signing up and the product value is clearer.

This protects cost while keeping value high. Users can still take generated expert prompts to their own AI tool and paste results back into MiseForge. Hosted AI can later be introduced for selected high-leverage actions such as dialogue polish, scene diagnosis, scene breakdown, and final packet passes.

## Current UI and Layout State

The landing page is separated from the app. The app lives at `/app` and should function as the command center.

Recent UI direction:

- The app dashboard now emphasizes that users can start wherever their film currently is.
- The left sidebar acts as a production spine: Idea, Treatment, Characters, Locations, Look Book, Script, Scene Breakdown, Shot List, Production Schedule, Sound Map, Prompt Cards, and Production Packet.
- The project workspace now includes a status strip showing current room, production readiness, packet status, and access level.
- Project cards use clearer action language: "Open command center."
- Free/pro/admin language has been cleaned up so users see value, not internal product strategy.
- The guide assistant is positioned as a helper that teaches production discipline and answers questions.

## Screenshots Captured for Review

Local screenshots were captured from the current build after the latest polish pass:

- Landing page screenshot: `docs/brief-assets/miseforge-landing.png`
- App dashboard screenshot: `docs/brief-assets/miseforge-app-dashboard.png`

These screenshots are embedded in the companion PDF.

## Built Product Modules

### Landing Page

The landing page currently sells the idea that AI scripts should stop sounding like AI and that filmmakers need more than prompts. It includes:

- Cinematic hero section.
- "Fix a Scene Free" proof-of-value demo.
- App CTA.
- Concrete deliverables section.
- Workflow path.
- Pricing cards.

### Authentication and Projects

Implemented:

- Google sign-in through Supabase.
- Supabase-backed saved projects.
- Saved project cards.
- Project pages.
- Admin access detection.
- Free, Founder Pro, and Admin access states.
- Sign-out and billing portal flow.

### App Command Center

The app dashboard allows users to start from:

- Idea.
- Script import.
- Scene breakdown.
- Character consistency.
- Production packet.

The dashboard also shows the full production pipeline so users understand they do not need to begin at step one.

### Dynamic Guide Assistant

Implemented:

- Guide character component.
- Stage-aware guide context.
- Chat-style question area.
- Quick route cards.
- Production teaching language.
- "Mini philosopher" tone direction: the assistant explains why a workflow step matters instead of only naming buttons.

Current limitation:

- The guide is not backed by a live model yet. It is rules/context driven, which matches the no-hosted-API launch strategy.

### Story Development Suite

Implemented or scaffolded:

- Logline Lab.
- Treatment Blueprint.
- Theme and story notes.
- Protagonist want versus need framing.
- Central conflict and act-path direction.
- Story readiness diagnostics.

Current limitation:

- It is still template/workflow driven and could be deepened with more structured form fields and examples.

### Script Import and Parser

Implemented:

- `.txt`, `.md`, and `.fountain` import path.
- Scene parsing from screenplay text.
- Slugline, location, time-of-day, characters, props, scene count, night scenes, and production readiness calculation.
- Scene packet generation from parsed script data.

### Dialogue and AI Voice Scanner

Implemented:

- AI Voice Scanner 2.0 workflow.
- Rubric-oriented analysis.
- Flags for robotic, expositional, or unplayable dialogue.
- Rewrite prompt compiler.
- Scorecard and suggested rewrite moves.

Current limitation:

- Without hosted AI, this currently produces structured prompts and workflow guidance rather than a model-generated rewrite.

### Character Bible

Implemented:

- Character bible module.
- Per-character consistency fields.
- Physical description, wardrobe, props, speech, emotional arc, and continuity direction.
- Character readiness scoring.

Value:

- This directly attacks one of the biggest AI filmmaking problems: characters looking or behaving inconsistently across generated shots.

### Location Bible

Implemented:

- Location bible module.
- Layout, time of day, color/lighting, dressing, required props, and continuity risk tracking.
- Location readiness scoring.

Value:

- Helps keep AI-generated locations visually consistent across scenes.

### Visual Language / Look Book

Implemented:

- Look book / style bible module.
- Palette, lighting, lens/camera feel, visual motifs, and reference direction.
- Scene look cards and style rules.

Value:

- Gives the film a consistent visual DNA before prompts are generated.

### Scene Breakdown

Implemented:

- Scene packets.
- Scene purpose, summary, characters, location, time, props, wardrobe, sound, color/feel, blocking, insert shot, image prompt, animation prompt, and continuity risks.
- Regeneration path and prompt compilation.

### Shot List Builder

Implemented:

- Structured shot list rows tied to scenes.
- Shot type, angle, movement, lens feel, duration, action, dialogue, and notes.
- Buttons/workflows for generating corresponding image, animation, sound, and dialogue prompts.

Value:

- Moves the app closer to an actual director/DP handoff document rather than a text prompt dump.

### Prompt Cards

Implemented:

- Prompt card builder.
- Image prompts.
- Animation prompts.
- Sound/dialogue prompts.
- Tool/workflow awareness.
- Insert shot generation logic.

### Continuity Tracker

Implemented:

- Cross-scene continuity tracker.
- Props, wardrobe, lighting, character state, location state, sound, and prompt consistency.
- Continuity risk language and readiness checks.

### Production Schedule / Generation Order

Implemented:

- Production schedule/generation order module.
- Recommended order of operations for AI film generation.
- Lock phases, review gates, dependencies, and blockers.

Value:

- Helps a filmmaker know what to generate first, what must be locked before later shots, and what order reduces continuity failures.

### Sound Design Map

Implemented:

- Scene-level sound map.
- Room tone, texture, practical sound, sound blockers, dialogue space, silence, and mix continuity.
- Sound priority queue.

Value:

- Treats sound as part of pre-production instead of an afterthought.

### Production Board

Implemented:

- Production board summary.
- Props, wardrobe, locations, sound, insert shots, prompt readiness, shot list, and set dressing.
- Gating for full board access under Founder Pro.

### Exports

Implemented:

- Copy production packet.
- Markdown production packet download.
- Premium PDF preview/export flow for Pro/Admin.
- Premium packet HTML with cover, production roadmap, producer handoff, table of contents, story diagnostic, readiness, style, character, location, continuity, documents, versions, and scene packet sections.

Current limitation:

- The PDF/export design is improved but should still be polished into a stronger premium artifact.

### Billing

Implemented:

- Stripe product/price flow.
- Checkout route.
- Customer portal route.
- Webhook route.
- Subscription entitlement checks.
- Cancel-at-period-end behavior tested by user.

Known direction:

- Pricing now favors $12.99/month over $2.99/week.

## Access Model

Free users:

- Can start one project.
- Can preview a scene-packet workflow.
- Can copy expert prompts.
- Can export Markdown/basic packet.
- Hit Founder Pro gates on deeper workflow modules and premium export.

Founder Pro:

- Unlocks multiple projects and full production workflow.
- Unlocks deeper bibles, boards, schedule, sound maps, version history, prompt cards, and premium exports.

Admin:

- Full access for testing and development.

## Current Strengths

- The niche is sharp and defensible.
- The no-hosted-API launch strategy is financially safer.
- The app now has real workflow depth beyond a simple prompt box.
- The strongest value is practical pre-production discipline for AI filmmakers.
- Character, location, visual, continuity, schedule, shot, and sound modules make the app feel closer to a suite.
- The guide assistant can become a meaningful teaching layer for users without film-school experience.

## Current Risks and Gaps

- The UI may still need a full visual redesign to feel premium enough for a paid suite.
- Some modules are still template/workflow driven rather than deeply interactive structured editors.
- The premium PDF export needs more visual polish and may become one of the strongest paid artifacts.
- The guide assistant is not yet truly conversational with live intelligence.
- The app should eventually include real sample projects and better before/after proof.
- The product needs analytics so we know which actions lead to activation and payment.
- Public language should never overexplain internal implementation choices or API strategy.

## Recommended Near-Term Next Work

1. Polish the premium PDF artifact so it feels like a professional film packet.
2. Tighten the app shell into a more fixed workspace layout with fewer long-scroll sections.
3. Improve each workflow module from "template card" toward structured editable production data.
4. Build one perfect demo project that shows the full pipeline from scene to packet.
5. Add analytics for landing CTA, sign-in, project creation, import, saved scene packet, export click, checkout start, and subscription.
6. Add richer guide assistant behavior without hosted API first, then consider hosted chat later for Pro users.
7. Reassess pricing after testing whether users prefer $12.99/month or $9/project pass.

## Questions for Claude Review

Please review this app as a product, business, and UI/UX system.

1. Does MiseForge now deliver enough concrete value to support the positioning as a pre-production command center for AI filmmakers?
2. Which modules feel essential for launch, and which can wait?
3. Is the current pricing model clearer and more trustworthy than weekly billing?
4. Should the product lean more toward subscription, project pass, or both?
5. Does the no-hosted-API launch strategy hurt perceived value, or does the workflow/prompt system justify the product?
6. Which landing page claim should be the primary headline?
7. What is the strongest free-to-paid conversion moment?
8. What should the premium PDF packet include to feel worth paying for?
9. What UI/layout changes would make the app feel less like a prototype and more like premium production software?
10. What would you cut, rename, or simplify before trying to get the first serious beta users?

## Verdict So Far

MiseForge has moved meaningfully closer to the product thesis. It is still not finished, but it now has enough structured workflow depth to be evaluated as a real AI-filmmaking pre-production suite rather than just a prompt wrapper. The next major challenge is not adding more names to the feature list. It is making the interface, outputs, and paid artifact feel premium, concrete, and easy to trust.
