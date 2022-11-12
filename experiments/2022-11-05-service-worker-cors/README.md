Findings:

- GitHub does not allow requests sent from browser.
- If a request specifies Authorization header, the browser will force the OPTION preflight
- GitHub blocks all OPTIONS preflight
- There is no chrome extension to get around this constraint
