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
   c. ctrl + enter key will confirm selection of id but preserve search temrs as title for editing
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
   a. Matching title is used by default
   b. When search terms is used i.e. "How to code in js", undo will revert to original title

Lorem [Result item 1](20230910071232) ipsum
       ^^^^^^^^^^^^^
       This portion is auto selected


```

## Editing link editing workflow
