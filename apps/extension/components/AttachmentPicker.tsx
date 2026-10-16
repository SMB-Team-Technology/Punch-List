import { cn, MAX_ATTACHMENTS, UPLOAD_IMAGE_ACCEPT } from '@marklayer/types';
import { ImagePlus, Loader2, X } from 'lucide-preact';
import { useRef, useState } from 'preact/hooks';
import { geist } from '../lib/geist';
import { compressImage } from '../lib/image';
import { Tooltip } from './Tooltip';

/**
 * Upload queue for one composer's attachments. `upload` is injected rather than
 * imported because the extension and the web app reach the same `/f` endpoint
 * through different origins (absolute vs. relative) — same split as every other
 * network call shared between the two (see `share.ts` vs. `projects.ts`).
 */
export function useAttachments({
  upload,
  pending,
}: {
  upload: (file: File | Blob) => Promise<string | null>;
  /** An upload begun before the composer opened (the pin's screenshot); it queues like a picked file. */
  pending?: Promise<string | null>;
}) {
  const [ids, setIds] = useState<string[]>([]);
  // Mirrors `ids` so `settled` can read the list as it is after an await, not as it was at render.
  const idsRef = useRef<string[]>([]);
  const inflight = useRef(new Set<Promise<unknown>>());
  /** The pin's screenshot, once it lands: an attachment, but not something the author wrote. */
  const [autoId, setAutoId] = useState<string | null>(null);

  const updateIds = (next: (prev: string[]) => string[]) => {
    idsRef.current = next(idsRef.current);
    setIds(idsRef.current);
  };

  /** Settles one upload into the list; the caller has already counted it in `uploading`. */
  const watch = (job: Promise<string | null>, onId?: (id: string) => void) => {
    const done = job
      .catch(() => null)
      .then((id) => {
        if (id) {
          updateIds((prev) => [...prev, id]);
          onId?.(id);
        }
        inflight.current.delete(done);
        setUploading((n) => n - 1);
      });
    inflight.current.add(done);
  };

  // Adopted in the initializer so it runs once per composer; the callbacks only fire after mount.
  const [uploading, setUploading] = useState(() => {
    if (!pending) return 0;
    watch(pending, setAutoId);
    return 1;
  });

  const track = (job: Promise<string | null>) => {
    setUploading((n) => n + 1);
    watch(job);
  };

  const addFiles = (files: Iterable<File>) => {
    let slots = MAX_ATTACHMENTS - ids.length - uploading;
    for (const file of files) {
      if (slots <= 0) break;
      if (!file.type.startsWith('image/')) continue;
      slots--;
      // A canvas re-encode would flatten a GIF to its first frame, so those
      // upload as-is; every other format gets downscaled and recompressed —
      // the anonymous endpoint has no auth to gate volume by otherwise.
      track((file.type === 'image/gif' ? Promise.resolve(file) : compressImage(file)).then(upload));
    }
  };

  /** Every attachment once the uploads in flight have landed, so Post can wait rather than refuse. */
  const settled = async (): Promise<string[]> => {
    while (inflight.current.size) await Promise.all(inflight.current);
    return idsRef.current;
  };

  /** Pulls image files out of a paste event, so a screenshot on the clipboard attaches the same way a picked file does. */
  const onPaste = (e: ClipboardEvent) => {
    const files = [...(e.clipboardData?.items ?? [])]
      .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((f): f is File => f !== null);
    if (files.length) addFiles(files);
  };

  return {
    ids,
    /** Gates a composer's submit: an in-flight paste-upload has no second chance to attach once the comment is posted. */
    uploading: uploading > 0,
    /** Attachments the author chose; the pin's own screenshot alone does not make a comment. */
    picked: ids.filter((id) => id !== autoId).length,
    full: ids.length + uploading >= MAX_ATTACHMENTS,
    addFiles,
    onPaste,
    settled,
    remove: (id: string) => updateIds((prev) => prev.filter((x) => x !== id)),
    reset: () => updateIds(() => []),
  };
}

export type Attachments = ReturnType<typeof useAttachments>;

/** The strip both composer layouts lay their thumbs out on. */
const STRIP = 'flex items-center gap-1.5 flex-wrap mt-1.5';

/** Unwrapped thumbs, so the strip and the strip-plus-button share one copy of the markup. */
function Thumbs({ attachments, resolveUrl }: { attachments: Attachments; resolveUrl: (id: string) => string }) {
  return (
    <>
      {attachments.ids.map((id) => (
        <div key={id} class="relative shrink-0">
          <img
            src={resolveUrl(id)}
            alt="Attached screenshot"
            class="h-10 w-10 rounded-md object-cover border border-(--ds-gray-alpha-400)"
          />
          <button
            type="button"
            onClick={() => attachments.remove(id)}
            aria-label="Remove screenshot"
            class="absolute -top-1.5 -right-1.5 grid place-items-center h-4 w-4 rounded-full
                   bg-(--ds-gray-1000) text-(--ds-background-100) cursor-pointer border-none p-0
                   outline-none transition-colors duration-150 ease-out hover:bg-(--ds-gray-1000)/90
                   focus-visible:outline-solid focus-visible:outline-2
                   focus-visible:outline-offset-1 focus-visible:outline-(--ds-focus-color)"
          >
            <X size={10} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
      ))}
      {attachments.uploading && (
        <div class="h-10 w-10 rounded-md border border-(--ds-gray-alpha-400) grid place-items-center shrink-0">
          <Loader2 size={14} class="animate-spin text-(--ds-gray-700)" aria-hidden="true" />
        </div>
      )}
    </>
  );
}

/**
 * Thumbnail strip for a composer's in-progress attachments. Renders nothing
 * when there is nothing to show, so a plain-text reply costs it no vertical
 * space. `resolveUrl` turns an upload id into a servable `src`, same
 * extension/web split as `upload` above.
 */
export function AttachmentThumbs({
  attachments,
  resolveUrl,
  class: className,
}: {
  attachments: Attachments;
  resolveUrl: (id: string) => string;
  /** Aligns the strip with whatever horizontal inset the surrounding composer uses. */
  class?: string;
}) {
  if (attachments.ids.length === 0 && !attachments.uploading) return null;
  return (
    <div class={cn(STRIP, className)}>
      <Thumbs attachments={attachments} resolveUrl={resolveUrl} />
    </div>
  );
}

/** Bare add-image icon button. Meant to sit inline in a composer's action row, next to Cancel/Reply. */
export function AttachButton({ attachments, label }: { attachments: Attachments; label?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button
        type="button"
        disabled={attachments.full}
        onClick={() => inputRef.current?.click()}
        aria-label={label ? undefined : 'Attach a screenshot'}
        class={cn(
          geist.ctlXs,
          geist.ctlIdle,
          label && geist.ctlLabel,
          'disabled:opacity-40 disabled:pointer-events-none',
        )}
      >
        <ImagePlus size={14} strokeWidth={1.75} aria-hidden="true" />
        {label && 'Image'}
        <Tooltip text="Attach a screenshot" />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={UPLOAD_IMAGE_ACCEPT}
        multiple
        class="hidden"
        onChange={(e) => {
          const input = e.currentTarget;
          if (input.files) attachments.addFiles(input.files);
          input.value = '';
        }}
      />
    </>
  );
}

/**
 * A reply composer's action row: attach on the left, Cancel and Reply on the
 * right. Shared for the same reason the attach controls above are — the
 * extension's `ThreadCard` and the web app's `AnnotationDetail` are the same
 * composer twice, and a restyle here has to land on both. `onCancel` need not
 * clear the queue; that is this row's job either way.
 */
export function ComposerActions({
  attachments,
  onCancel,
  onSubmit,
}: {
  attachments: Attachments;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <div class="flex items-center justify-between gap-1 px-1.5 pb-1.5 pt-0.5">
      <AttachButton attachments={attachments} />
      <div class="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => {
            attachments.reset();
            onCancel();
          }}
          class={cn(geist.bareBtn, geist.bareBtnQuiet, 'font-medium h-6 px-2')}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={attachments.uploading}
          class={cn(
            geist.ctlOn,
            'inline-flex items-center justify-center h-6 px-2.5 rounded-md border-none cursor-pointer outline-none',
            'text-meta font-medium disabled:pointer-events-none disabled:opacity-50',
          )}
        >
          Reply
        </button>
      </div>
    </div>
  );
}

/** A posted comment or reply's own attachments — plain thumbnails, opening full-size in a new tab. */
export function AttachmentGallery({ ids, resolveUrl }: { ids: string[]; resolveUrl: (id: string) => string }) {
  if (ids.length === 0) return null;
  return (
    <div class={STRIP}>
      {ids.map((id) => (
        <a key={id} href={resolveUrl(id)} target="_blank" rel="noreferrer" class="shrink-0">
          <img
            src={resolveUrl(id)}
            alt="Attached screenshot"
            class="h-14 w-14 rounded-md object-cover border border-(--ds-gray-alpha-400)"
          />
        </a>
      ))}
    </div>
  );
}
