// haiku
export function haikuToHtml(markdown: string) {}
export function htmlToHaiku(html: string) {}

// history
export function pushHistory() {}
export function popHistory() {}

// fragment level (multi-line)
export function insertHaiku(markdown: string) {}

// selection
export function selectionToHaiku(selection: Selection) {}
export function selectionToLines(selection: Selection) {}
export function markSelectionDirty(selection: Selection) {}

// caret
export function saveCaret(selection: Selection) {}
export function restoreCaret() {}

// editing
export function runAtomic(fn: () => any) {}
export function formatInline(line: HTMLElement) {}

export function swapLines(lines: HTMLElement[], offset: number) {}
export function indent(lines: HTMLElement[], offset: number) {}
