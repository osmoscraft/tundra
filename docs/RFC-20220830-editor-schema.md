# Allowed types

- Root
  - Children: 0..many List items
- List item = Paragraph | Quote | Code
- Paragraph
  - Children: Text and Link
- Quote
  - Children: Text only
- Code
  - Children: Text only

# Operations

- Insert link
  - Cursor must be collapsed
- Set link href
  - Selection must be link subset
- Edit link href
  - Selection must be link subset
- Unlink
  - Selection must be link subset
- Insert line break
- Indent/outdent
- Swap with above/below
- Duplicate up/down
- Grow/shrink selection
- Convert block to paragraph/quote/code
- Join (ala vim)
- Create next item (with auto indent)
- Fix document indent
- Fix document content
