# Allowed types

- Root
  - Children: 0..many List items
- List item = Paragraph | Quote | Code
- Paragraph
  - Children: Text and Link
- Quote
  - Children: Text and Link
- Code (TBD)
  - Children: Text only
- Link
  - Children: Text

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

# HTML Format rules

- List item only
  - Remove all top level elements that are not list items
  - Ensure top level element is one of the allowed types: Paragraph, Quote, Code
- Inline validation
  - Ensure quote Paragraph and Quote only has link and text
    - Violation will be converted to text
  - Ensure link content is only text
    - Violation will be converted to text
- Proper indent level, let i(N) represent the indent of row N
  - i(0) == 0
  - i(N) and i(N+1) must satisfy one of the following
    - sibling: i(N) === i(N+1)
    - child: i(N) + 1 === i(N+1)
    - set different level: i(N) > i(N+1) >= 0
  - If a rule is violated
    - Reduce i(N) until all rules are satisfied
    - If i(N) < 0, set i(N) = 0
- No empty line
  - Trim all whitespace at the beginning and end of each line
  - Remove all items with `<br>` as the only content

# Markdown schema (WIP)

- Each line must start with 0..2xN spaces followed by "-", followed by any character, ended with linebreak
  - Need solution for multi-line item
  - Need solution for code block ```
- The number of spaces must be rational
  - First item must not have spaces
  - Item N and Item N + 1 must satisfy one of the following
    - silbing
    - parent-child
    - level reset
