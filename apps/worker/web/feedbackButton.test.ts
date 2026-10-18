import { describe, expect, test } from 'bun:test';
import { feedbackButtonHtml, feedbackButtonMarkdown, feedbackWidgetScript } from './feedbackButton';

describe('feedback button snippet', () => {
  test('escapes the url so a stray quote cannot break out of href', () => {
    const html = feedbackButtonHtml({ url: 'https://feedback.smbteam.com/s/a"><script>x</script>?a=1&b=2' });
    expect(html).not.toContain('<script>');
    expect(html).toContain(
      'href="https://feedback.smbteam.com/s/a&quot;&gt;&lt;script&gt;x&lt;/script&gt;?a=1&amp;b=2"',
    );
  });

  test('markdown link survives parentheses and spaces in the url', () => {
    const md = feedbackButtonMarkdown({ url: 'https://feedback.smbteam.com/s/a b(c)' });
    expect(md.startsWith('[Leave feedback](https://feedback.smbteam.com/s/a%20b%28c%29)')).toBe(true);
  });

  test('script snippet keeps a hostile id inside its attribute', () => {
    const script = feedbackWidgetScript({
      origin: 'https://feedback.smbteam.com',
      kind: 'page',
      id: '"><img src=x onerror=alert(1)>',
    });
    expect(script).not.toContain('<img');
    expect(script).toBe(
      '<script src="https://feedback.smbteam.com/widget.js" data-room="&quot;&gt;&lt;img src=x onerror=alert(1)&gt;" async></script>',
    );
  });
});
