# Calibrd Agent

Will a hiring manager shortlist you for this role? [Calibrd](https://www.calibrd.com) scores one job posting against your CV and answers that before you spend an evening on the application. It shows where you fall short at your level, the questions each round will ask, how your CV lands with a recruiter and with an applicant tracking system, and it drafts the cover letter when you decide the job is worth it.

This repository is the plugin manifest only. The server runs at `https://www.calibrd.com/mcp`.

Listed on [Smithery](https://smithery.ai/servers/justinxcguo/calibrd-agent) and [Glama](https://glama.ai/mcp/servers/Calibrd/calibrd-agent), and in the official MCP registry as `com.calibrd/agent`.

## Install

**Claude (claude.ai):** Settings → Connectors → Add custom connector → URL `https://www.calibrd.com/mcp`.

**Claude Code:**

```
claude mcp add --transport http calibrd https://www.calibrd.com/mcp
```

**Grok (grok.com / Grok Bot):** grok.com/connectors → Custom → paste the URL.

**Grok Build, Cursor, other MCP clients:** copy `.mcp.json` into your project, or install this plugin from the xAI marketplace.

Give the tools a posting as text or as a link (public LinkedIn job pages, Greenhouse, Lever, Levels.fyi, careers pages). Connecting opens a Calibrd sign-in once. Reports are free, three a day. A pass removes the cap and unlocks every tool; payment is on calibrd.com, never in the chat.

## Tools

| Tool | What it does | Gate |
|---|---|---|
| `calibrd_score_job` | Match score 0–100 and the gaps at your level | Free |
| `calibrd_report` | The full Calibrd report on one job | Free, 3 a day |
| `calibrd_review_cv` | Recruiter and ATS scores, what to fix | Free |
| `calibrd_cover_letter` | A draft from your CV for one job | One free, then a pass |
| `calibrd_status` | What you have on Calibrd | Free |
| `calibrd_get_pass` | A checkout link for a pass | Free to ask |

## Running it over stdio

Most clients connect straight to `https://www.calibrd.com/mcp` and none of this
is needed. `bridge.mjs` is here for the two cases that cannot: clients that
speak only stdio, and directory scanners that need a process to start and
introspect.

```
node ./bridge.mjs
```

No dependencies and no build step — it is one file on the Node standard
library. It answers `initialize` and `tools/list` locally, so listing the tools
needs no account and no network. Running one does: `tools/call` forwards to the
hosted server with the bearer token in `CALIBRD_ACCESS_TOKEN`, and says so
plainly when there isn't one. `CALIBRD_MCP_URL` overrides the endpoint.

The tool catalogue in `bridge.mjs` mirrors the hosted server. If the server
gains or changes a tool, update the file — nothing enforces that automatically.

## Your data

Calibrd Agent runs inside your assistant. Your CV, the job description and the report pass through your assistant's provider (Anthropic, OpenAI or xAI) under their terms. Calibrd itself keeps none of it: reports and CVs are generated and returned, not stored.

Full details: https://www.calibrd.com/agent and https://www.calibrd.com/privacy

## License

MIT, for this manifest. Calibrd itself is a hosted service under its own terms.
