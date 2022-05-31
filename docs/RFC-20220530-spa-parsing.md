# Problem

Some SPA routed web app does not reflect the latest URL in the document `<head>`. For example YouTube uses SPA to navigate between different videos but the canonical URL in document `<head>` will always be the first URL when the page is server rendered.

# Solutions

1. Always use server side parsing to extract metadata first, fallback to local when remote isn't available (e.g. offline)
   - Pro: correctness
   - Con: network latency
2. Somehow detect whether the client URL is out of sync
