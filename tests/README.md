# Regression and acceptance tests

Requires Node 22+. Install development tools outside the deployed site root:

```
npm install --prefix /tmp/booktaste-testdeps jsdom playwright
JSDOM_PATH=/tmp/booktaste-testdeps/node_modules/jsdom node --test tests/*.test.*
NODE_PATH=/tmp/booktaste-testdeps/node_modules node tests/browser.cjs
```

For an existing Chromium binary, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE`.

## Scope

38 automated tests cover API validation, malformed JSON, spelling normalization, exclusions, duplicate output, unknown inputs, retry limits, provider/quota failures, unavailable binding, origin checks, catalog matching and failures, markup escaping, storage corruption/unavailability, reload recovery, theme persistence, read-list handling, and concurrent submission prevention.

Browser tests cover widths 320, 360, 390, 768, 1366px, dark/light themes, long recommendation cards, horizontal overflow, reload and equal-input validation. These are Chromium tests; Safari/iOS and real mobile devices have not been tested.

AI and catalog responses are mocked in regression tests. Live acceptance tests are separate: request known book pairs, check returned original-title/author catalog links, verify input exclusion and the two thematic explanations, then use more/read-list controls.

## Important limits

Open Library title/author matching verifies a catalog record, not the Persian translation, plot summary or subjective recommendation quality. Translated Persian titles are explicitly unverified; author names are taken from the catalog. Incomplete coverage, provider errors and free-tier quotas can result in fewer than six recommendations or a recoverable error. Do not replace those errors with fabricated books.

The model can still misinterpret an input or provide weak thematic links. No test suite can guarantee every future AI response. Keep the visible caveat and source links.
