# Frame Header

## Language options

- YAML: balanced human readability, GitHub preview capability, wide adoption, programmatic editing
- Plaintext: more resistent to obsolescence
- JSON: better parsing performance (assuming javascript environment)

## Content

- Creation time
- Modfication time
- Body content type
- Custom metadata

## Extensibility

- Body parser can store metadata in the Header
  - e.g. A markdown parser can extract keyword from content and stores in the header
- Body and Header parser should be mutually exclusive
- Body parser should implement a standard API to generate required information
  - e.g. generate plaintext from content (with all special characters removed)
  - e.g. generate a list of ids and urls that the content is linking to
- Standalone header parser plugin can override metadata from body parser and header parser
  - e.g. A tag plugin that takes the plaintext output from body parser and generate a list of tags
  - e.g. A summarization plugin that takes the plaintext output and generate a paragraph of summary

## Example

### Header

```yaml
---
btime: 1658687267547
ctime: 1658687529186
mime: "text/markdown"
ext:
  tags: ["graph theory", "database design"]
  private: true
---
Body content starts here.
```
