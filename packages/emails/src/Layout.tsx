import { Body, Container, Head, Hr, Html, Img, Preview, Section, Text } from '@react-email/components';
import type { ReactNode } from 'react';

/**
 * The shell every Punch List email shares. Templates supply a body and a preview
 * line; framing, width and footer live here so a new template cannot drift.
 *
 * Everything is authored in px and hex on purpose — the build rejects `rem`
 * (Outlook ignores it) and the theme only carries the `#`-valued tokens, since
 * `oklch()` renders as black in half the inboxes that exist.
 */
export function Layout({ preview, children }: { preview: string; children: ReactNode }) {
  return (
    <Html lang="en">
      <Head>
        {/* Without this, Gmail/Apple Mail auto-dark-mode inverts every color:
            the near-black button and white label flip to a washed-out light
            button with black text, and the white page turns charcoal. This
            template has no dark palette to offer instead, so it opts out and
            renders identically everywhere. */}
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      {/* The line a client shows next to the subject. Left out, it fills with whatever text comes first. */}
      <Preview>{preview}</Preview>
      <Body className="bg-white font-sans text-ml-fg m-0 p-0">
        <Container className="mx-auto max-w-[480px] px-6 py-10">
          {/* SMB Team's logo, served from this app's own origin. Where a client
              blocks remote images, the alt text stands in, set as a wordmark. */}
          <Img
            src="https://feedback.smbteam.com/email-logo.png"
            width="145"
            height="30"
            alt="SMB Team"
            className="mb-8 block text-ml-fg text-[15px] font-semibold"
          />
          {children}
          <Hr className="my-8 border-0 border-t border-solid border-[#eaeaea]" />
          <Section>
            <Text className="m-0 text-[12px] leading-[18px] text-[#8f8f8f]">
              Punch List by SMB Team ·{' '}
              <a href="https://feedback.smbteam.com" className="text-[#8f8f8f]">
                feedback.smbteam.com
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
