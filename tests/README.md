# Regression tests

Requires Node 22+ and jsdom for DOM tests. AI responses are mocked: these tests verify the contract and failure handling, not bibliographic truth or model quality.

```
npm install --prefix /tmp/booktaste-testdeps jsdom
JSDOM_PATH=/tmp/booktaste-testdeps/node_modules/jsdom node --test tests/*.test.*
```

Live acceptance checks: obtain recommendations for two known titles; inspect author/title and both thematic connections; request more, mark a book read, reload, toggle theme; verify narrow/mobile layout. A free-plan quota failure must remain an error, never a fabricated result.
