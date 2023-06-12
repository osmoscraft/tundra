export function tokenize(source: string) {
  // pseudo code - FSM based tokenizer
  // ROOT: if start with ITEM_MARKER -> emit ITEM_MARKER; then go to ITEM
  // ITEM: if start with LEADER -> emit LEADER; then go to INLINE
  // INLINE: if start with LINK -> emit LINK; then go to INLINE
  // INELIN: if not start with LINK -> emit TEXT until EOF, EOL, or LINK; then go to ITEM
}
