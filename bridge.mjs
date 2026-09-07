#!/usr/bin/env node
// A stdio bridge to the hosted Calibrd MCP server.
//
// Calibrd Agent is a remote server: it runs at https://www.calibrd.com/mcp and
// signs people in with their own Calibrd account over OAuth. Most clients
// (Claude, Grok, Cursor) connect to that URL directly and never need this file.
//
// This bridge exists for the two cases that cannot:
//   1. Clients that speak only stdio and have no remote transport.
//   2. Directory scanners, which need a process they can start and introspect.
//
// So tools/list is answered here, from the catalogue below, without a network
// call or a credential. Calling a tool is different: that needs a real Calibrd
// account, so tools/call forwards to the hosted server with the bearer token in
// CALIBRD_ACCESS_TOKEN and says plainly what to do when there isn't one.
//
// The catalogue mirrors web/lib/agent/tools.ts in the Calibrd repo. If a tool
// changes there, change it here — nothing enforces that automatically, and a
// bridge advertising a tool the server no longer has is worse than no bridge.

import { createInterface } from "node:readline";

const MCP_URL = process.env.CALIBRD_MCP_URL ?? "https://www.calibrd.com/mcp";
const TOKEN = process.env.CALIBRD_ACCESS_TOKEN ?? "";
const VERSION = "1.0.1";
const PROTOCOL_VERSION = "2025-06-18";

const NOT_SIGNED_IN =
  "This bridge has no Calibrd credentials, so it can list the tools but not run them. " +
  "Set CALIBRD_ACCESS_TOKEN, or connect https://www.calibrd.com/mcp directly in an " +
  "assistant that supports remote MCP servers and sign in there. Details: https://www.calibrd.com/agent";

const jobUrl = {
  type: "string",
  format: "uri",
  maxLength: 2000,
  description:
    "Link to a public posting: a LinkedIn job page (search links with currentJobId work too), Greenhouse, Lever, Levels.fyi or a careers page. Calibrd fetches and reads it. Prefer this over asking the person to paste when they share a link.",
};
const jobDescription = {
  type: "string",
  description:
    "The full job posting text, pasted as-is (at least 200 characters). When the person shares a link instead, pass job_url and leave this out.",
};
const cvText = { type: "string", description: "The person's CV or resume as plain text." };
const jobTitle = { type: "string", maxLength: 200, description: "Job title, if not obvious from the posting." };
const company = { type: "string", maxLength: 200, description: "Company name, if not obvious from the posting." };
const language = {
  type: "string",
  enum: ["en", "fr"],
  description: "Output language. Defaults to English; use fr for a French job posting.",
};

const schema = (properties, required = []) => ({ type: "object", properties, required });

const TOOLS = [
  {
    name: "calibrd_status",
    title: "Calibrd account status",
    description:
      "The person's Calibrd account: free or pass, days left, reports left today, mock interview rounds left, what is included. Call it for any question about their Calibrd account, plan, pass, reports or mock rounds, including 'what do I have on Calibrd', and before suggesting a pass.",
    inputSchema: schema({}),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "calibrd_score_job",
    title: "Score a job against a CV",
    description:
      "Scores how well a person's CV matches one job posting (0 to 100), lists the gaps at that level, and scores the CV itself for this job as a recruiter and as an applicant tracking system read it. Free, no daily cap. Call it when someone asks whether to apply, or to triage several postings; use calibrd_report for the full read on the ones that score well.",
    inputSchema: schema({ job_url: jobUrl, job_description: jobDescription, cv_text: cvText, job_title: jobTitle, company, language }, ["cv_text"]),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  {
    name: "calibrd_report",
    title: "Calibrd report on a job",
    description:
      "Builds the full Calibrd report for one job posting: the shortlist read, gaps at the person's level, the questions each round will ask, the interview process and a compensation benchmark. With a CV it also scores the CV against the job. Free, three a day; a pass removes the cap. Call it when someone wants to prepare for a specific role.",
    inputSchema: schema({ job_url: jobUrl, job_description: jobDescription, cv_text: cvText, job_title: jobTitle, company, language }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  {
    name: "calibrd_review_cv",
    title: "Review a CV",
    description:
      "Scores a CV two ways, as a recruiter reads it and as an applicant tracking system parses it, and lists what to fix with rewrites. Pass the job posting to tailor the review to that role. Free. Call it when someone asks how their CV reads or what to change.",
    inputSchema: schema({ cv_text: cvText, job_url: jobUrl, job_description: jobDescription, job_title: jobTitle, company, language }, ["cv_text"]),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  {
    name: "calibrd_cover_letter",
    title: "Draft a cover letter",
    description:
      "Drafts a cover letter for one job from the person's CV, in the posting's language. One free draft, then it needs a Calibrd pass; the tool says so and gives the link. Call it only when the person asks for a cover letter.",
    inputSchema: schema(
      {
        job_url: jobUrl,
        job_description: jobDescription,
        cv_text: cvText,
        job_title: jobTitle,
        company,
        tone: { type: "string", maxLength: 100, description: "A tone in a few words, for example 'direct and warm'." },
        existing_draft: { type: "string", maxLength: 10000, description: "A draft to refine instead of starting over." },
        language,
      },
      ["cv_text"],
    ),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  },
  {
    name: "calibrd_get_pass",
    title: "Get a Calibrd pass",
    description:
      "Creates a checkout link for a Calibrd pass (week, month or search) that removes the daily report cap and unlocks every tool. Payment happens on calibrd.com through Stripe, never in the chat. Call it only when the person asks to buy, or after a tool said it needs a pass. Prices are on https://www.calibrd.com/#pricing.",
    inputSchema: schema(
      {
        tier: { type: "string", enum: ["week", "month", "search"], description: "week = 7 days, month = 30 days, search = 90 days." },
        currency: { type: "string", enum: ["usd", "eur"], description: "eur for Eurozone buyers; defaults to usd." },
      },
      ["tier"],
    ),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  },
];

function send(message) {
  process.stdout.write(JSON.stringify(message) + "\n");
}

const result = (id, value) => send({ jsonrpc: "2.0", id, result: value });
const failure = (id, code, message) => send({ jsonrpc: "2.0", id, error: { code, message } });
const textResult = (id, text, isError = false) => result(id, { content: [{ type: "text", text }], isError });

// Forward one tool call to the hosted server. Streamable HTTP answers either
// JSON or an SSE stream depending on the request, so accept both and pull the
// first data frame out of a stream.
async function callRemote(id, params) {
  if (!TOKEN) return textResult(id, NOT_SIGNED_IN, true);
  let response;
  try {
    response = await fetch(MCP_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({ jsonrpc: "2.0", id, method: "tools/call", params }),
    });
  } catch (e) {
    return textResult(id, `Could not reach the Calibrd server at ${MCP_URL}: ${e?.message ?? e}`, true);
  }
  if (response.status === 401 || response.status === 403) return textResult(id, NOT_SIGNED_IN, true);
  const body = await response.text();
  if (!response.ok) return textResult(id, `Calibrd returned ${response.status}: ${body.slice(0, 500)}`, true);
  const payload = body.startsWith("event:") || body.startsWith("data:")
    ? body.split("\n").find((line) => line.startsWith("data:"))?.slice(5).trim()
    : body;
  try {
    const parsed = JSON.parse(payload ?? body);
    if (parsed.error) return failure(id, parsed.error.code ?? -32603, parsed.error.message ?? "Calibrd returned an error");
    return result(id, parsed.result);
  } catch {
    return textResult(id, `Could not read the response from Calibrd: ${body.slice(0, 500)}`, true);
  }
}

async function handle(message) {
  const { id, method, params } = message;
  // Notifications carry no id and expect no reply.
  if (id === undefined) return;

  switch (method) {
    case "initialize":
      return result(id, {
        protocolVersion: params?.protocolVersion ?? PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "calibrd", title: "Calibrd Agent", version: VERSION },
        instructions:
          "Calibrd reads one job posting against one CV and says whether it would make the shortlist. Running a tool needs a Calibrd account; listing them does not.",
      });
    case "ping":
      return result(id, {});
    case "tools/list":
      return result(id, { tools: TOOLS });
    case "tools/call":
      return callRemote(id, params);
    default:
      return failure(id, -32601, `Method not found: ${method}`);
  }
}

const lines = createInterface({ input: process.stdin });
lines.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let message;
  try {
    message = JSON.parse(trimmed);
  } catch {
    return failure(null, -32700, "Parse error");
  }
  // A batch is an array; answer each entry in order.
  const batch = Array.isArray(message) ? message : [message];
  for (const entry of batch) handle(entry).catch((e) => failure(entry?.id ?? null, -32603, e?.message ?? "Internal error"));
});
