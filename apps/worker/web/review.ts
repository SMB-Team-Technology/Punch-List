import { localUser, operations, patchOp, pushOp, signedBy, uiHidden } from '@ext/lib/state';
import { type Ballot, type DrawOp, orderedSteps, type QuestionOp, type StepOp } from '@marklayer/types';
import { computed, effect, signal } from '@preact/signals';
import { nanoid } from 'nanoid';
import { z } from 'zod/mini';
import { annotationId } from './projects';
import { compactChrome } from './signals';

/** The room's review state: the agent's checklist and the polls, derived from the op stream like guides are. */
export const reviewSteps = computed(() => orderedSteps(operations.value));
export const reviewQuestions = computed(() =>
  operations.value.filter((op): op is QuestionOp => op.tool === 'question'),
);

const versionRef = z.nullable(
  z.object({ id: z.string(), version: z.nullable(z.number()), sha: z.nullable(z.string()) }),
);
const previewInfoSchema = z.object({
  title: z.nullable(z.string()),
  note: z.nullable(z.string()),
  repo: z.nullable(z.string()),
  branch: z.nullable(z.string()),
  sha: z.nullable(z.string()),
  version: z.nullable(z.number()),
  previous: versionRef,
  next: versionRef,
});
export type PreviewInfo = z.infer<typeof previewInfoSchema>;

/** What `GET /api/:id/versions` said about this room; null until it answers, or on a room that is not a preview. */
export const previewInfo = signal<PreviewInfo | null>(null);

effect(() => {
  const id = annotationId.value;
  previewInfo.value = null;
  if (!id) return;
  fetch(`/api/${id}/versions`)
    .then((res) => (res.ok ? res.json() : null))
    .then((body: unknown) => {
      const parsed = previewInfoSchema.safeParse(body);
      // A slow answer for a page the project tabs have already left must not land on the next one.
      if (parsed.success && annotationId.peek() === id) previewInfo.value = parsed.data;
    })
    .catch(() => {});
});

/** Null until someone chooses: the panel then opens by itself exactly when the room has something to show. */
export const panelChoice = signal<boolean | null>(null);

export const hasReviewContent = computed(
  () =>
    reviewSteps.value.length > 0 ||
    reviewQuestions.value.length > 0 ||
    Boolean(previewInfo.value?.title || previewInfo.value?.note),
);

// A phone gets the panel on request only: opened by itself it would cover the page the link was sent for.
export const reviewPanelOpen = computed(
  () => !uiHidden.value && (panelChoice.value ?? (hasReviewContent.value && !compactChrome.value)),
);

/** Revoting patches your own ballot rather than adding one, so the stream does not grow per click. */
export function castVote({ question, option, mine }: { question: QuestionOp; option: number; mine?: Ballot }) {
  if (mine) {
    if (mine.option !== option) patchOp({ opId: mine.opId, patch: { option, ts: Date.now(), author: localUser.name } });
    return;
  }
  const op: DrawOp = {
    id: nanoid(),
    tool: 'vote',
    questionId: question.id,
    option,
    voter: localUser.id,
    ts: Date.now(),
    color: localUser.color,
    lineWidth: 1,
    ...signedBy(),
  };
  pushOp(op);
}

export function toggleStep(step: StepOp) {
  const done = !step.done;
  patchOp({ opId: step.id, patch: { done, doneBy: done ? localUser.name : null } });
}

export function askQuestion({ prompt, options }: { prompt: string; options: string[] }) {
  const op: QuestionOp = {
    id: nanoid(),
    tool: 'question',
    prompt,
    options,
    ts: Date.now(),
    color: localUser.color,
    lineWidth: 1,
    ...signedBy(),
  };
  pushOp(op);
}
