# Calibrd Agent

Would you make the shortlist? Calibrd Agent lets Claude, ChatGPT, Grok and any MCP client run [Calibrd](https://www.calibrd.com) on your account: score a job posting against your CV, get the full report, review your CV and draft a cover letter.

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

## Your data

Calibrd Agent runs inside your assistant. Your CV, the job description and the report pass through your assistant's provider (Anthropic, OpenAI or xAI) under their terms. Calibrd itself keeps none of it: reports and CVs are generated and returned, not stored.

Full details: https://www.calibrd.com/agent and https://www.calibrd.com/privacy

## License

MIT, for this manifest. Calibrd itself is a hosted service under its own terms.
