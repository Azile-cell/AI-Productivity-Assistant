# WorkFlow AI — Workplace Productivity Assistant

WorkFlow AI is a **no-API workplace productivity prototype** built for the CAPACITI AI Skills Programme. It demonstrates prompt-engineering thinking, responsible automation, structured outputs and practical workplace workflows without requiring a paid API key or external model service.

## Problem Statement
Professionals spend significant time drafting routine emails, organizing meeting notes, planning tasks and turning messy notes into action. WorkFlow AI brings those workflows into one focused interface.

## Solution
The deployed version uses a transparent local rules-and-templates engine. Nothing requires Claude, Gemini, OpenAI, an API key or a billing account.

## Features
- Smart Email Generator — audience/tone templates grounded only in entered facts
- Meeting Notes Summarizer — extracts discussion, explicit decisions and action items
- Task Planner — prioritizes tasks and builds a time-blocked draft schedule
- Research Assistant — summarizes user-supplied evidence; without a source it gives a research framework instead of inventing facts
- Workplace Assistant — locally routes requests to the best specialist tool
- Smart Workspace — classifies messy workplace notes into emails, tasks, meetings, research and missing information
- Local activity history
- Responsible AI / prototype-safety page

## Prompt Engineering Strategy
The project includes structured prompt blueprints in `lib/prompts.ts` as evidence of the prompt-engineering approach used during design. They follow:
1. Role
2. Objective
3. User inputs
4. Instructions
5. Output format
6. Constraints
7. Responsible AI safeguards
8. Missing-information handling

The live no-API prototype translates those principles into deterministic local rules: no invented owners/deadlines, visible placeholders, source-grounded research, structured output formats and human-review reminders.

## Responsible AI
- Missing information is not silently guessed.
- Meeting owners and deadlines use `Not specified` when absent.
- Research does not fabricate citations, studies, statistics or URLs.
- No live web browsing is claimed.
- No external model receives the user's text in this prototype.
- Important outputs should still be reviewed by a human.

## Technology Stack
- Next.js
- React
- TypeScript
- Tailwind CSS
- localStorage/sessionStorage
- Local deterministic workflow engine (`lib/local-engine.ts`)

## Architecture
All specialist tools call `lib/ai-client.ts`, which now delegates directly to `lib/local-engine.ts` in the browser. There are **no `/api/ai` or `/api/chat` routes**, no environment variables and no API keys.

## Running Locally
```bash
npm install
npm run dev
```
Then open `http://localhost:3000`.

## Project Structure
- `app/` — application pages
- `components/tools/` — specialist productivity interfaces
- `lib/local-engine.ts` — no-API local workflow logic
- `lib/prompts.ts` — prompt-engineering blueprints/documentation
- `lib/ai-client.ts` — local feature adapter
- `lib/activity.ts` — browser activity/history storage
- `lib/prefill.ts` — Smart Workspace tool handoff
- `lib/types.ts` — shared contracts

## Limitations
- This version deliberately does not use a generative-model API.
- Research without user-supplied source material returns a research plan rather than factual claims.
- Local parsing is rule-based, so complex language may require manual correction.
- Activity history is stored only in the current browser.

## Future Improvements
- Optional model integration only if a free, approved programme resource is provided
- Improved local natural-language parsing
- Export to PDF or DOCX
- Optional calendar/email integrations with explicit user consent

Built for the CAPACITI AI Skills Programme.
