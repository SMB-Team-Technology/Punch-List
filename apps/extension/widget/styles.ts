/** Constructable sheets first: a page's `style-src` cannot block them, where it can block a `<style>`. */
export function adoptStyles({ root, css }: { root: ShadowRoot; css: string }) {
  if ('adoptedStyleSheets' in root && typeof CSSStyleSheet.prototype.replaceSync === 'function') {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    root.adoptedStyleSheets = [sheet];
    return;
  }
  const style = document.createElement('style');
  style.textContent = css;
  root.append(style);
}
