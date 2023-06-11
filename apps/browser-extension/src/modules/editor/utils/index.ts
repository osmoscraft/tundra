// document level
export function markdownToHtml(markdown: string) {}
export function htmlToMarkdown(html: string) {}

export function pushHistory() {}
export function popHistory() {}

// fragment level (multi-line)
export function insertMarkdownFragment(markdown: string) {}
export function selectionToMarkdownFragment(selection: Selection) {}
export function markdownFragmentToHtml(selection: Selection) {}
export function htmlToMarkdownFragment(html: string) {}
export function selectionToLines(selection: Selection) {}

// caret
export function saveCaret(selection: Selection) {}
export function restoreCaret() {}

// editing
export function runAtomic(fn: () => any) {}
export function formatInline(line: HTMLElement) {}

export function markSelectionDirty(selection: Selection) {}

export function swapLines(lines: HTMLElement[], offset: number) {}
export function indent(lines: HTMLElement[], offset: number) {}
