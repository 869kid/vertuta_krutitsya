---
name: vertuta-debrief
description: Analyze the current chat session and append important findings to PROJECT_KNOWLEDGE.md for the vertuta_krutitsya project. Use when the user says "debrief", "подведи итоги", "запиши что мы сделали", "обнови знания", "save session", or asks to summarize the session. Also use proactively at the end of long productive sessions.
---

# Vertuta Debrief

Append session outcomes to the project knowledge file so other agents inherit context.

## Knowledge File

`PROJECT_KNOWLEDGE.md` (project root: `c:\Users\malenkimalysh\Documents\projects\vertuta_krutitsya\PROJECT_KNOWLEDGE.md`)

## Procedure

1. **Read** `PROJECT_KNOWLEDGE.md` to see what is already recorded.
2. **Analyze** the current session for entries worth adding. Categories:
   - `## Architecture Decisions` — design choices, rejected alternatives, rationale
   - `## Data & Formats` — data models, schema changes, encoding details
   - `## Scripts & Tools` — new utilities, skills, automation created or modified
   - `## Known Issues & Gotchas` — bugs, workarounds, things that break easily
   - `## Conventions` — naming, folder structure, coding patterns agreed upon
   - `## Open Tasks` — work started but not finished, next steps
3. **Filter** — only add entries that satisfy ALL of:
   - Not already in the file
   - Would help a future agent working on a different task
   - Specific enough to be actionable (includes file paths, function names)
   - NOT obvious from reading the code itself
   - NOT a trivial one-off action
4. **Append** new entries under the correct heading. Format:

```
### <short title> (<YYYY-MM-DD>)
<2-4 lines: what, where, why. Include file paths.>
```

5. **Do NOT** rewrite or reorganize existing entries. Append only.
6. **Report** to the user what was added (or "nothing new to record").
