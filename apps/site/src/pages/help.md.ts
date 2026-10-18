import type { APIRoute } from 'astro';
import { HELP_H1, HELP_INTRO, HELP_SECTIONS } from '../lib/help';

/** `/help` as plain Markdown, prerendered to `help.md` from the same source as the page. */
const sections = HELP_SECTIONS.map((s) =>
  [
    `## ${s.heading}`,
    ...(s.lead ?? []),
    ...(s.steps ? [s.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')] : []),
    ...(s.after ?? []),
  ].join('\n\n'),
).join('\n\n');

const body = `# ${HELP_H1}\n\n${HELP_INTRO}\n\n${sections}\n`;

export const GET: APIRoute = () => new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
