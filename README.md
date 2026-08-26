# WorkFlow AI — Workplace Productivity Assistant

WorkFlow AI is a workplace productivity application that uses structured AI prompts to help users draft professional emails, summarize meeting notes, prioritize tasks, research information, and turn unstructured workplace notes into actionable work.

## Problem Statement

Professionals spend significant time on repetitive tasks such as drafting emails, organizing notes, planning schedules, and understanding information. WorkFlow AI brings those tasks into one focused assistant while keeping human review and responsible AI safeguards visible.

## Solution

The application provides five specialist AI tools plus a Smart Workspace that classifies messy workplace notes and hands extracted items to the appropriate tool.

## Features

- Smart Email Generator
- Meeting Notes Summarizer
- AI Task Planner
- AI Research Assistant
- Workplace AI Chatbot
- Smart Workspace triage and tool handoff
- Local activity counters and output history
- Responsible AI guidance

## Smart Workspace Innovation

Smart Workspace accepts unstructured workplace notes and classifies them into emails, tasks, meetings, research needs, and missing information. Users can hand an extracted item to the relevant specialist tool with the form pre-filled. No external actions are performed automatically.

## Prompt Engineering Strategy

Prompts are centralized in `lib/prompts.ts` and follow a consistent structure:

1. Role
2. Objective
3. User inputs
4. Instructions
5. Output format
6. Constraints
7. Responsible AI safeguards
8. Missing-information handling

This structure improves consistency, reduces hallucination, controls output shape, handles missing information safely, and makes AI behaviour easier to test.

## Responsible AI

- Important outputs should be reviewed by a human.
- Missing details are not silently guessed.
- Meeting owners, deadlines, and decisions are not invented.
- Research does not fabricate citations, statistics, quotes, studies, or URLs.
- The app does not claim live web research unless a real search source is connected.
- Users are warned not to enter confidential or sensitive workplace information.

## Technology Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Vercel AI SDK
- Anthropic Claude API
- Zod structured output validation
- localStorage/sessionStorage for local activity and Smart Workspace handoff

## Architecture

Client tools send only the selected feature and user inputs to `/api/ai` or `/api/chat`. API routes validate input, select a server-side prompt, call Claude, validate structured output, and return only the result. The Anthropic API key is never exposed to client-side code.

## Installation

```bash
npm install
```

## Environment Variables

Create a local `.env.local` file:

```bash
ANTHROPIC_API_KEY=your_api_key_here
```

Never commit a real API key to GitHub.

## Running Locally

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Project Structure

- `app/` — pages and secure API routes
- `components/tools/` — specialist productivity interfaces
- `lib/prompts.ts` — structured AI prompts
- `lib/ai-client.ts` — typed frontend API client
- `lib/activity.ts` — local activity/history storage
- `lib/prefill.ts` — Smart Workspace handoff logic
- `lib/types.ts` — shared request/response contracts

## Limitations

- A valid Anthropic API key is required for real AI generation.
- The Research Assistant does not have live web access in the current version.
- AI output may still contain errors and must be reviewed before important use.
- Local history is stored only in the current browser.

## Future Improvements

- Optional verified web-search integration for current research
- Authentication and encrypted cloud history
- Calendar/email integrations with explicit user permission
- Export to PDF or DOCX
- Team workspaces and organization policies
