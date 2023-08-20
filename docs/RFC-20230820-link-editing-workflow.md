# Link Editing Workflow

## New link insertion workflow

```
1. Start: cursor is collapsed

Lorem ipsum
     ^

2. Ctrl+K: cursor move to url portion. Search begins
   a. Press Enter to generate an id for a new item
   b. Typeahead results in search
   c. Arrow keys to select items


Lorem []( ) ipsum
         ^
         +----------------------+
         |                      |
         +----------------------+
         | Recent item 1        |
         | Recent item 2        |
         | Recent item 3        |
         +----------------------+
         | New         (Enter)  |
         +----------------------+

3. As user moves cursor, the url portion will reflect the selected id
   a. escape key will completed remove the [](...) string
   b. enter key will confirm selection and move to title editing
   c. ctrl + (shift) + enter key will confirm selection of id but preserve search temrs as title for editing
   d. holding ctrl could allow a preview of the selected title being the search terms
   e. when creating new, search terms will be used as title


Lorem [](20230910071232) ipsum
         ^
         +----------------------+
         | How to code in js    |
         +----------------------+
         | Result item 1        | <- focus
         | Result item 2        |
         | Result item 3        |
         +----------------------+
         | New         (Enter)  |
         +----------------------+

4. Title revision
   a. Undo stack search term (if adopted) -> target title adoption -> pre-search title (is blank)

Lorem [Result item 1](20230910071232) ipsum
       ^^^^^^^^^^^^^
       This portion is auto selected


```

## Editing link editing workflow

```
1. Start: cursor selection

Lorem ipsum
      ^^^^^

2. Ctrl+K: cursor move to url portion. Search begins
   a. Similar workflow to new link insertion.
   b. Enter to confirm url only
   c. Ctrl + Enter to url and title override
   d. Ctrl + Shift + Enter to confirm url and title override with search terms
   c. the "ipsum" portion is auto selected for easy discard

Lorem [ipsum]( )
              ^
              +----------------------+
              | search term          | <- The input content is auto selected
              +----------------------+
              | Result item 1        |
              | Result item 2        |
              | Result item 3        |
              +----------------------+
              | New         (Enter)  |
              +----------------------+

3. Title revision
   a. Undo stack: search term adoption -> target title adoption -> pre-search title

Lorem [ipsum](20230910071232)
       ^^^^^
       This portion is auto selected


```

## Alt design, title revision with auto-suggestion

```
During the Title revision phase, instead of undo stack, show options as suggestions

Lorem [ipsum](20230910071232)
       ^
       +----------------------+
       | search term          | <- the "ipsum" portion is auto selected
       | Result item 1        | <- target document title
       | ipsum                | <- pre-search document title
       | Untitled             | <- option to use blank title
       +----------------------+
```
