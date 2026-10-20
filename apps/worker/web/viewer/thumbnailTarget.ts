/**
 * The dashboard row this page draws the thumbnail for, or null when it is not one.
 *
 * A site's row is its first page — `OwnedLink.id` is that page's annotation — so
 * only page 0 speaks for it; a deeper page would put the wrong picture on the card.
 */
export function thumbnailTarget({
  project,
  pages,
  pageIdx,
  annotation,
}: {
  project: string | null;
  pages: readonly { id: string }[];
  pageIdx: number;
  annotation: string;
}): string | null {
  if (project) return pageIdx === 0 ? (pages[0]?.id ?? null) : null;
  return annotation || null;
}
