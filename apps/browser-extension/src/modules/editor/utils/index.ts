// load/save
export function markdownToHtml(markdown: string) {}
export function htmlToMarkdown(html: string) {}

// basic typing
export function formatInline(line: HTMLElement) {}

// insert
export function insertMarkdownFragment(markdown: string) {}

// copy
export function selectionToMarkdownFragment(selection: Selection) {}
export function selectionToHtml(selection: Selection) {}

// paste
export function htmlToMarkdownFragment(html: string) {}

// cut = copy + delete

// undo/redo
export function push() {}
export function pop() {}

export function runAtomic(fn: () => any) {}
export function saveCaret(selection: Selection) {}
export function restoreCaret() {}

// line movement
export function selectionToLines(selection: Selection) {}
export function swapLines(lines: HTMLElement[], offset: number) {}

// link: same as insertMarkdownFragment

// dirty tracking
export function markSelectionDirty(selection: Selection) {}
