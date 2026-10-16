/** Copy on click, with a moment of "Copied" in the button's label. Hidden until this runs. */
export const wireCopy = ({ button, text }: { button: HTMLElement; text: () => string }) => {
  if (!navigator.clipboard) return;
  button.hidden = false;
  button.addEventListener('click', () => {
    navigator.clipboard.writeText(text()).then(() => {
      const slot = button.querySelector('[data-ml-copy-label]');
      const before = slot?.textContent ?? '';
      button.dataset.copied = '';
      if (slot) slot.textContent = 'Copied';
      setTimeout(() => {
        delete button.dataset.copied;
        if (slot) slot.textContent = before;
      }, 1600);
    });
  });
};

/** Every code block's copy button on the page (the bar `rehype-code-blocks.mjs` draws). */
export const wireCodeCopy = () => {
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-ml-copy-code]')) {
    const code = button.closest('.ml-code')?.querySelector('pre');
    if (code) wireCopy({ button, text: () => code.textContent ?? '' });
  }
};
