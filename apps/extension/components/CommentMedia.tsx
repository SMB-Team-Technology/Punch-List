import type { CommentOp } from '../lib/types';
import { AttachmentGallery } from './AttachmentPicker';
import { VideoPlayer } from './VideoPlayer';
import { VoicePlayer } from './VoiceNote';

/** Everything a posted comment carries besides its text, the same on every surface that shows one. */
export function CommentMedia({
  op,
  resolveUrl,
}: {
  op: Pick<CommentOp, 'attachments' | 'voice' | 'video'>;
  resolveUrl: (id: string) => string;
}) {
  return (
    <>
      {op.attachments && <AttachmentGallery ids={op.attachments} resolveUrl={resolveUrl} />}
      {op.voice && <VoicePlayer id={op.voice} resolveUrl={resolveUrl} />}
      {op.video && <VideoPlayer id={op.video} resolveUrl={resolveUrl} />}
    </>
  );
}
