// Apart from the recorder so playback-only surfaces (the widget) skip its Base UI menu.
/** A posted video note: the browser's own player over the stored clip. */
export function VideoPlayer({ id, resolveUrl }: { id: string; resolveUrl: (id: string) => string }) {
  return (
    // biome-ignore lint/a11y/useMediaCaption: its narration's transcript is the comment's own text, right above the player
    <video
      controls
      playsInline
      preload="metadata"
      src={resolveUrl(id)}
      aria-label="Video note"
      class="mt-1.5 aspect-video w-full max-w-full rounded-md bg-black object-contain"
    />
  );
}
