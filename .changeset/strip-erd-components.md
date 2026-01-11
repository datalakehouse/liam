---
"@liam-hq/erd-core": patch
"@liam-hq/schema": patch
"@liam-hq/ui": patch
"@liam-hq/cli": patch
---

Remove workspace dependency on @liam-hq/neverthrow by inlining helper functions

This change eliminates the workspace dependency issue that prevented embedding the ERD component in external NextJS projects. The neverthrow helper functions (fromThrowable, fromPromise, defaultErrorFn) are now inlined directly into the packages that use them.
