import { authStore } from './auth';
import type { Env } from './env';
import { FAILURE_WINDOW_SECONDS, unlockFailureStore } from './lock/failures';
import { sweepExpired } from './rooms-lifecycle';
import { nowInSeconds } from './time';

// The only cron (`0 3 * * *`): this fork has no landing demo board to reset.
export const scheduled: ExportedHandlerScheduledHandler<Env['Bindings']> = async (_event, env) => {
  // Rooms, projects, their cards, Slack threads and uploads, under one deadline rule.
  await sweepExpired({ env });

  // Expired sessions and spent magic links are dead weight, not history.
  await authStore(env.DB).sweepExpired();
  await unlockFailureStore(env.DB).sweep(nowInSeconds() - FAILURE_WINDOW_SECONDS);
};
