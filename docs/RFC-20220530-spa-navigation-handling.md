# Problem

Some SPA routed web app does not reflect the latest URL in the document `<head>`. For example YouTube uses SPA to navigate between different videos but the canonical URL in document `<head>` will always be the first URL when the page is server rendered.

# Solutions

1. Always use server side parsing to extract metadata first, fallback to local when remote isn't available (e.g. offline)
   - Pro: correctness
   - Con: network latency
2. Somehow detect whether the client URL is out of sync
3. Considered APIs
   - `webNavigation` for detecting push/replace state
   - `webRequest` for detecting network requests (not useful)
   - `storage` for tracking which tabs are dirty
   - `scripting` for marking a document as dirty

## High-touch solution

- Use `webNavigation` and `scripting` together.
- When push/replace state happens, `webNavigation` fires, and injects a script to set a flag on the document object.
- Later when we parse the document, we inspect the flag and decide whether to use the document html as is, or request fresh html with `fetch` API.
- This technique is simple and yet makes the best effort to respond with existing content unless a fetch is needed.
- Future improvements:
  1. Distinguish push vs. replace. The latter shouldn't require the fetch
  2. Reducing fetch latency by pre-cache the URL. But we need to avoid this on metered network.
  3. Use mutation observer to detect `<head>` element change and determine whether it's out of sync

## Low-touch soluion

- Use url and title from activeTab, which are always fresh
- Don't worry about other metadata fields, including canonical URL and description
- Future improvement
  - On demand, request scripting permissing to crawl the DOM
  - On the backend, asynchronously crawl the URL and update the "final" record

# Decision

Go with low-touch solution. Augment with backend crawling if needed.
