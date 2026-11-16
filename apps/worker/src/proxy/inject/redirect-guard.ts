import { FRAME_MESSAGE } from '../../../shared/frame-protocol';
import { escapeForScript } from './script-text';

/**
 * Hands a page's own attempt to leave the frame to the viewer, as a link click would.
 *
 * A redirect the proxy could not follow — a script-only stub, a delayed refresh,
 * a stub pointing at another host — otherwise navigates the frame straight off
 * the proxy: a root-relative `location.replace` resolves against our origin and
 * lands on our 404, a meta refresh resolves against `<base>` and goes
 * cross-origin. Either way the viewer was left with an unmarked document and
 * called the page broken. The Navigation API is the one hook that sees all of
 * them; where it is missing, the old behaviour stands.
 *
 * Our own frame routes pass untouched, so the viewer switching pages, a proxied
 * form GET and a reload all still go through.
 */
export const redirectGuardScript = ({ selfOrigin, origin }: { selfOrigin: string; origin: string }): string =>
  `<script>window.navigation&&navigation.addEventListener("navigate",function(e){if(!e.cancelable||e.destination.sameDocument||e.hashChange||e.formData||e.downloadRequest!==null)return;if(e.navigationType==="reload"||e.navigationType==="traverse")return;var u;try{u=new URL(e.destination.url)}catch(x){return}if(!/^https?:$/.test(u.protocol))return;if(u.origin==="${selfOrigin}"){if(/^\\/(proxy|doc|px)(\\/|$)/.test(u.pathname))return;u=new URL(u.pathname+u.search+u.hash,"${escapeForScript(origin)}")}e.preventDefault();window.parent.postMessage({type:"${FRAME_MESSAGE.navigate}",url:u.href,redirect:true},"${selfOrigin}")})</script>`;
