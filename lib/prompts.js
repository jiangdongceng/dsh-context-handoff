/** Prompts used by the handoff summarizer and by the new conversation. */

export const SUMMARIZER_SYSTEM_PROMPT = `You write context briefs for an AI assistant.
A context brief captures the established setting, facts, rules, preferences, files, and current state of a previous conversation so a fresh assistant understands the background before the user gives a new instruction.
You are a careful editor, not a participant: do not continue any task, do not reply to the user, and do not invent facts.
Preserve exact names, paths, commands, identifiers, numbers, rules, decisions, failures, and user constraints when they matter.
Mark anything uncertain as "(unconfirmed)" instead of guessing. Omit greetings, filler, and mechanical back-and-forth.
This is a description of the setting and background, not a task assignment: do not produce next steps, to-do lists, or work instructions.
Do not show analysis or a preamble. Return only the requested Markdown document.`

export const SEGMENT_SYSTEM_PROMPT = `You compress one slice of a long AI-assistant conversation into notes for a later context brief.
Keep the established setting, facts, rules, preferences, decisions, file paths, commands, errors, results, and current state that a new assistant would need in order to understand the background.
Do not continue any task, do not answer the user, do not invent facts, and do not turn the notes into a plan or to-do list. Use terse bullets. Preserve exact identifiers and numbers.
Do not show analysis or a preamble. Return only the notes.`

/** Build the prompt for one intermediate chunk of a long transcript. */
export function buildSegmentPrompt({ segment, previousNotes, index, total, focus }) {
  const parts = [
    `This is slice ${index} of ${total} from one conversation.`,
    previousNotes === undefined || previousNotes.trim() === ''
      ? 'This is the first slice, so there are no earlier notes.'
      : `Carry forward these notes from earlier slices:\n\n<earlier-notes>\n${previousNotes}\n</earlier-notes>`,
    focus === undefined || focus.trim() === ''
      ? ''
      : `The user especially wants the final context brief to preserve this focus:\n<focus>\n${focus}\n</focus>`,
    `New slice:\n\n<slice>\n${segment}\n</slice>`,
    'Write notes for the final context brief. Keep at most 900 words. Describe established context only; do not add next steps. Do not wrap the answer in a code fence. Do not add a preamble.',
  ]
  return parts.filter(part => part !== '').join('\n\n')
}

/** Build the final prompt that turns a transcript or rolling notes into the brief. */
export function buildFinalPrompt({ material, focus, multiPass }) {
  const parts = [
    multiPass
      ? 'The material below is a set of rolling notes from a long conversation, in order.'
      : 'The material below is a conversation transcript, with long tool output clipped.',
    focus === undefined || focus.trim() === ''
      ? ''
      : `The user especially wants this handoff to preserve:\n<focus>\n${focus}\n</focus>`,
    `Material:\n\n<material>\n${material}\n</material>`,
    `Write the final context brief now. Use exactly this Markdown structure, every heading, in this order:

## Premise and purpose
## Established facts and setting
## Rules, constraints, and preferences
## People, characters, and terminology
## Files, tools, and technical setup
## Decisions already made
## Current state
## Open questions

Rules:
- Address the next assistant directly in neutral, concise language.
- Use terse bullets, not long prose. Aim for under 1,200 words unless the background genuinely needs more.
- Write in the dominant language of the material, so the next assistant understands the context naturally.
- This is background, not a task assignment. Do not add next steps, to-do lists, or instructions to continue or resume any work.
- Describe "Current state" as a fact, not as a command or plan.
- Include only information supported by the material. Never invent a file, command, result, rule, or decision.
- Preserve exact paths, commands, branch names, identifiers, URLs, names, and numbers when they appeared.
- In "Open questions", list uncertainty or unresolved facts; do not turn them into an action plan. Write "(none)" when there are none.
- Do not include a message-by-message recap, a raw transcript, or long code blocks.
- Do not mention that you are an AI or that this is a summary.
- Do not wrap the answer in a code fence.`,
  ]
  return parts.filter(part => part !== '').join('\n\n')
}

/** Build the first message sent into the clean continuation session. */
export function buildContinuationMessage(brief) {
  const source = brief.sourceTitle && brief.sourceTitle.trim() !== ''
    ? ` from the conversation "${brief.sourceTitle}"`
    : ''
  const cwd = typeof brief.sourceCwd === 'string' && brief.sourceCwd !== ''
    ? `Working directory: ${brief.sourceCwd}`
    : ''
  return [
    `You are starting a new conversation with background${source}. The original conversation is intentionally not attached; do not try to reconstruct or quote it.`,
    `An AI-written context brief follows. Treat it as established background, not as a transcript or a task list.`,
    ...(cwd === '' ? [] : [cwd]),
    '',
    '<context-brief>',
    brief.summary,
    '</context-brief>',
    '',
    'Do not resume, continue, or act on any previous task. Do not propose next steps or start working. The user will send a new instruction separately. For now, reply in one short sentence confirming that you have the context and are ready, then wait.',
  ].join('\n')
}
