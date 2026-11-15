# Conversation context

## What it does

Long DSH conversations carry a lot of established background: the project premise, rules, terminology, technical setup, decisions, and user preferences. This plugin captures that background before the old conversation becomes expensive to carry around:

1. A model reads the source conversation (with long tool output clipped) and writes a structured context brief.
2. The brief is saved locally and can be reviewed or edited in the Web UI.
3. One click creates a clean conversation in the same workspace, selects the same model route and agent preset when possible, and sends only the context brief as its first message.

The old conversation is never modified, and the new conversation never receives the old transcript. The new assistant uses the brief to understand the setting and background, **not to resume or continue the old task**. It replies briefly that it has the context, then waits for the user's next instruction.

## Where to find it

- **Session header** — the context icon beside the other conversation actions opens the UI with the current conversation selected.
- **Settings → Conversation context** — browse, search, edit, delete, and start conversations from saved briefs; create a brief from any recent conversation.

## The main flow

1. Open a conversation that has started and has a model route.
2. Click the context icon in the session header.
3. Optionally write a focus line, for example “keep the project background, rules, and API decisions”.
4. Choose **Generate context brief**. The plugin summarizes the conversation in one pass when it fits, or in ordered slices for a long conversation.
5. Review the generated Markdown. Edit the title or body if needed.
6. Choose **Start a new conversation with this context**. The plugin creates a clean conversation, restores the source workspace/model/preset when available, sends the brief as the first user message, and opens it.

The new assistant is explicitly told that the original conversation is not attached, that the brief is background rather than a task list, and that it must not continue the old task. It waits for the user to send a new instruction.

## What the brief contains

The generated Markdown follows a fixed structure:

- Premise and purpose
- Established facts and setting
- Rules, constraints, and preferences
- People, characters, and terminology
- Files, tools, and technical setup
- Decisions already made
- Current state
- Open questions

The prompt asks the model to preserve exact paths, commands, identifiers, names, numbers, rules, failures, and user constraints, and to mark uncertain claims as unconfirmed. It explicitly forbids next steps, to-do lists, and work instructions.

## Privacy and data

- The source conversation text is sent to the model that writes the brief. The UI states this before generation.
- Only the generated context brief is sent to the new conversation. Raw messages are not copied.
- Briefs are stored as JSON at `<DSH_HOME>/context-handoff/briefs.json` by default. If the dedicated folder `D:\dsh\context-handoff` already exists, the plugin reuses it. Set a `dataDir` plugin config value or the `DSH_CONTEXT_HANDOFF_DIR` environment variable to choose another absolute directory. Every write keeps the previous file as `briefs.json.bak`.
- The plugin registers authenticated routes under `/api/handoff/*` through DSH's connection service; they are available only to the owner Peer.

## Good to know

- Generation is on demand. **Cancel generation** or closing the dialog aborts the in-flight browser request and asks the host to stop the summary call. A brief that had already completed and been saved remains in the list.
- A source conversation with no user messages, no readable surface, or no model route produces a clear error instead of creating an empty new conversation.
- If the source agent preset is no longer available, the start flow retries without the preset rather than failing outright. Model selection is best-effort.
- Conversations are summarized in slices (up to 60,000 characters each, about 12 slices for a 700,000-character conversation). A safety ceiling of roughly 2.4 million characters after clipping still refuses truly extreme histories instead of silently dropping content.
- If a slice produces no visible text (for example because the route spent its output budget on reasoning), the plugin retries it with a larger budget and then splits it into smaller slices. The final brief also retries with a smaller material window and uses the lightest reasoning effort the route advertises.
- If a model stops at its output-token ceiling while writing the final brief, the plugin asks it to continue and appends the continuation (up to two times). Slice notes that hit their ceiling are kept as partial notes rather than failing the whole job.
- Inline tool output is clipped: 14,000 characters per message, 2,000 per tool result, 700 per tool argument. Existing compaction checkpoints are included as earlier context. The brief is a summary, not an audit log.
- This plugin is compatible with the installed DSH `0.2.2-rc.3` Web surface. It does not patch DSH core packages.

## Troubleshooting

**“No model route yet”** — send one message in the source conversation or select a model for that session, then generate again.

**Generation fails with a provider error** — the plugin uses the source conversation's current model route (with the lightest reasoning effort advertised). Switch the source session to an available model and retry.

**The new conversation opens but shows no answer** — check whether the model route is still available. The brief is admitted even when model selection falls back; a provider failure appears as that session's turn error.

**The UI shows “Could not load context briefs”** — confirm the page is connected to the same DSH host and reload once. The routes are authenticated and are not reachable from another origin.
