export function pushCursorState(stack: Range[]) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return;
  const range = selection?.getRangeAt(0);
  stack.push(range);
}

export function popCursorState(stack: Range[]) {
  const cachedRange = stack.pop();
  if (!cachedRange) return;
  const selection = window.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(cachedRange);
}
