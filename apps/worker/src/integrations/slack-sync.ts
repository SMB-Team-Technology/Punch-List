import { isWatchableOp } from '@marklayer/agent-tools';
import type { AnnotationOp, DrawOp } from '@marklayer/types';
import type { AnnotationRoom } from '../annotation-room';
import { replyOp } from '../mcp';
import {
  decryptToken,
  displayName,
  type InboundReply,
  parentMessage,
  postMessage,
  replyMessage,
  slackOpId,
} from './slack-app';
import { slackStore } from './slack-store';

/** Slack-born replies are drawn in one colour, so a room can tell them apart at a glance. */
const SLACK_COLOR = '#611f69';

const findAnnotation = ({ ops, id }: { ops: DrawOp[]; id: string }) =>
  ops.find((o): o is AnnotationOp => isWatchableOp(o) && o.id === id);

/**
 * Post a batch of new ops to the room's Slack channel, in order: a new
 * annotation opens a thread, a reply goes into its parent's.
 *
 * Returns null when the room has no install, so the caller's breaker only
 * counts rooms that are actually wired up. `ops` is a thunk because most rooms
 * have no install, and only a thread that needs opening reads the room.
 */
export async function postBatchToSlack({
  db,
  tokenKey,
  roomId,
  items,
  ops,
  roomUrl,
  origin,
}: {
  db: D1Database;
  tokenKey: string;
  roomId: string;
  items: DrawOp[];
  ops: () => DrawOp[];
  roomUrl: string;
  origin: string;
}): Promise<{ sent: number; failed: number } | null> {
  const store = slackStore(db);
  const install = await store.install(roomId);
  if (!install) return null;
  const token = await decryptToken({ secret: tokenKey, sealed: install.sealedToken, roomId });
  if (!token) return { sent: 0, failed: items.length };

  let roomOps: DrawOp[] | undefined;
  const threads = new Map<string, string>();
  let sent = 0;
  let failed = 0;

  /** The thread an annotation lives in, opening it if this is the first anyone has heard of it. */
  const threadOf = async (annotationId: string): Promise<string | null> => {
    const known = threads.get(annotationId);
    if (known) return known;
    const stored = await store.threadFor({ roomId, annotationId });
    if (stored && stored.channel_id === install.channelId) {
      threads.set(annotationId, stored.thread_ts);
      return stored.thread_ts;
    }
    roomOps ??= ops();
    const parent = findAnnotation({ ops: roomOps, id: annotationId });
    const text = parent ? parentMessage({ op: parent, roomUrl, origin }) : null;
    if (!text) return null;
    const ts = await postMessage({ token, channel: install.channelId, text });
    if (!ts) {
      failed++;
      return null;
    }
    sent++;
    threads.set(annotationId, ts);
    await store.saveThread({
      roomId,
      annotationId,
      teamId: install.teamId,
      channelId: install.channelId,
      threadTs: ts,
    });
    return ts;
  };

  for (const op of items) {
    if (op.tool === 'comment' && op.parentId) {
      const text = replyMessage({ op, origin });
      const threadTs = text ? await threadOf(op.parentId) : null;
      if (!text || !threadTs) continue;
      const ts = await postMessage({ token, channel: install.channelId, text, threadTs });
      if (ts) sent++;
      else failed++;
    } else {
      await threadOf(op.id);
    }
  }
  return { sent, failed };
}

type RoomStub = Pick<DurableObjectStub<AnnotationRoom>, 'agentSnapshot' | 'agentPushOp'>;

/**
 * A human's threaded Slack reply, written into the room as a reply op on the
 * annotation that thread belongs to, through the same RPC the MCP `reply` tool
 * uses. Every check here is a reason to drop it silently: Slack only needs a 200.
 */
export async function applyInboundReply({
  db,
  tokenKey,
  reply,
  roomStub,
}: {
  db: D1Database;
  tokenKey: string;
  reply: InboundReply;
  roomStub: (roomId: string) => RoomStub;
}): Promise<boolean> {
  const store = slackStore(db);
  const thread = await store.annotationFor({
    teamId: reply.teamId,
    channelId: reply.channel,
    threadTs: reply.threadTs,
  });
  if (!thread) return false;
  const install = await store.install(thread.room_id);
  if (!install || install.teamId !== reply.teamId || install.channelId !== reply.channel) return false;
  // Our own posts carry `bot_id` and are dropped before here; this catches one that does not.
  if (reply.user === install.botUserId) return false;

  const stub = roomStub(thread.room_id);
  const [snapshot, author] = await Promise.all([
    stub.agentSnapshot(thread.room_id),
    decryptToken({ secret: tokenKey, sealed: install.sealedToken, roomId: thread.room_id }).then((token) =>
      token ? displayName({ token, user: reply.user }) : 'Slack user',
    ),
  ]);
  const parent = findAnnotation({ ops: snapshot.ops, id: thread.annotation_id });
  if (!parent) return false;
  const op = replyOp({
    id: slackOpId({ channel: reply.channel, ts: reply.ts }),
    parent,
    ops: snapshot.ops,
    text: reply.text,
    signature: { color: SLACK_COLOR, ts: Date.now(), author, authorId: `slack-${reply.user}` },
  });
  return stub.agentPushOp(thread.room_id, op);
}
