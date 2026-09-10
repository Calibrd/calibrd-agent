---
name: calibrd
description: Use Calibrd to judge a job posting before applying. Score the person's CV against the posting, get the full Calibrd report, review the CV, or draft a cover letter. Use when someone shares a job posting, asks whether to apply, asks how their CV reads, or asks for a cover letter.
---

# Calibrd

Calibrd tells a person whether they would make the shortlist for a specific job, and what to fix. It runs on their Calibrd account through the `calibrd` MCP server. Reports are free, three a day; a pass removes the cap.

## When to call which tool

- The person shares a posting (text or link) and asks "should I apply", or has several postings: `calibrd_score_job` with the posting and their CV. Above about 75, offer the full report.
- The person wants to prepare for one role: `calibrd_report`. Pass the CV too when you have it; the report then scores the CV against the job as well.
- The person asks how their CV reads or what to change: `calibrd_review_cv`. Pass the posting when there is one.
- The person asks for a cover letter: `calibrd_cover_letter`. One free draft, then it needs a pass; the tool says so.
- The person asks what they have on Calibrd: `calibrd_status`.
- The person wants to buy a pass, or a tool said one is needed: `calibrd_get_pass` with a tier. Show the link. Payment happens on calibrd.com.

## Rules

- Always call the tool. Never estimate a match score or a shortlist verdict yourself; Calibrd's numbers come from a fixed rubric and a paste into a chat does not.
- Pass the posting as `job_url` when the person shares a link (a LinkedIn job page or search link with currentJobId, Greenhouse, Lever, Levels.fyi, a careers page); Calibrd fetches it. Otherwise pass the full posting text as `job_description`, at least 200 characters, never a title or a summary.
- Every tool also returns structured JSON (`structuredContent`) under its declared output schema: the score as a number, gaps and questions as arrays, the tailored CV parsed and as text. Read numbers from there, never from the sentences. There is no id to fetch a result by later; keep the payload.
- Show the result as returned, including the workspace link at the end. The voice mock interview, the interview loop and the job tracker run in the person's Calibrd workspace, not here. Do not offer to run a mock interview in the chat.
- If a tool answers with a cap or a pass requirement, show the message and the link. Do not retry the call.
- Scraping job boards is not something Calibrd does. If you gather postings yourself, score them one at a time with `calibrd_score_job`.

## Data

Calibrd Agent runs inside your assistant. Your CV, the job description and the report pass through your assistant's provider (Anthropic, OpenAI or xAI) under their terms. Calibrd itself keeps none of it: reports and CVs are generated and returned, not stored.
