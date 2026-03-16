# StoryWeaver - Active Execution

## Task: Remove Intensity Dials + Enhance Generic Seed Prompt

**Session**: 2026-03-16
**Context**: Remove all intensity dials (unused complexity), rewrite generic seed generation prompt with XML framework, wire template context into seed gen for both modes.

## Execution Status

### ✅ Completed Tasks

- [x] Step 1: Types + config foundation — removed `IntensityValues`, `Dial` type, `intensity` from `DialState`, `Preset`, `Template.settings`, `GenerateDreamscapesParams`, `EnhanceDreamscapeParams`. Added `templateContext` to `GenerateDreamscapesParams`.
- [x] Step 2: Deleted `dials.json`, removed `DIALS` export from config.ts, removed `getDial()`
- [x] Step 3: Removed `settings.intensity` from all 48 template JSON files
- [x] Step 4: Core logic — removed `buildIntensityPrompt()`, `adjustIntensity()` from openai.ts, stripped intensity from `buildSystemPrompt()`, cleaned prompt-builders.ts, mock.ts
- [x] Step 5: API routes — removed intensity from dreamscapes/generate route, added templateContext
- [x] Step 6: UI + state — removed `randomizeIntensity`, `genIntensity`, `showGenAdvanced`, `randomizeDialIntensity`, intensity sliders UI, `DIALS` import from create page. Removed intensity from app-store.ts.
- [x] Step 7: Generic seed prompt rewrite — `buildGenericSeedPrompt()` with full XML framework (`<role>`, `<context>`, `<template_context>`, `<constraints>`, `<expectation>`, `<examples>`). Template context injected when template selected but no seedPrompt.
- [x] Step 8: Power user wiring — `handleGenerateDreamscapes` now passes `selectedTemplate?.seedPrompt`, `templateId`, and `templateContext`
- [x] Step 9: usePromptInspector.ts — removed `genIntensity` param and all intensity references
- [x] Step 10: Docs — updated PROMPT_FRAMEWORK.md (seed prompts now use XML), CLAUDE.md (removed dials references, updated key concepts)
- [x] Step 11: Build verification — passes clean

### ✅ Completed (B2)

- [x] Upgrade 11 hero template seedPrompts to XML structure (manually crafted per template)

## Changes Made

### Files Modified
- `src/lib/types.ts` — removed IntensityValues, Dial; stripped intensity from DialState, Preset, Template.settings, GenerateDreamscapesParams, EnhanceDreamscapeParams; added templateContext
- `src/lib/config.ts` — removed DIALS export, Dial import, getDial()
- `src/config/presets.json` — removed intensity from all 5 presets
- 48 template JSON files — removed settings.intensity
- `src/lib/adapters/openai.ts` — removed buildIntensityPrompt, adjustIntensity; added buildGenericSeedPrompt with XML framework; stripped intensity from buildSystemPrompt and enhanceDreamscape
- `src/lib/adapters/mock.ts` — removed intensity from enhance prompt call
- `src/lib/prompt-builders.ts` — removed all intensity references and DIALS import
- `src/app/api/dreamscapes/generate/route.ts` — removed intensity, added templateContext
- `src/app/app/create/page.tsx` — removed all intensity state/UI/imports, wired seedPrompt+templateContext into both generate flows
- `src/hooks/usePromptInspector.ts` — removed genIntensity param and all intensity references
- `src/store/app-store.ts` — removed intensity from initial dialState
- `docs/PROMPT_FRAMEWORK.md` — updated seed generation section (XML structure)
- `CLAUDE.md` — removed dials references, updated key concepts

### Files Deleted
- `src/config/dials.json`

## Implementation Notes

### Generic Seed Prompt (buildGenericSeedPrompt)
- Full XML structure: `<role>`, `<context>`, `<constraints>`, `<expectation>` in system prompt
- `<task>`, `<format>`, `<examples>` in user prompt
- When template is selected but has no seedPrompt, `<template_context>` block is injected with template name, category, and description
- Good/bad examples included (3 each with explanations)
- Vibe inserted into `<task>` when provided

### Template Context Flow
- Normal mode: template's seedPrompt OR generic with templateContext → already worked, now also passes templateContext
- Power user mode: now also passes selectedTemplate?.seedPrompt and templateContext (was missing before)
