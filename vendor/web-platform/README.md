# Web tooling sources

| Bundled source | Version or revision | License | Entry point |
| --- | --- | --- | --- |
| [Google Chrome Modern Web Guidance](https://github.com/GoogleChrome/modern-web-guidance) | Complete official npm distribution 1.0.2 | Apache-2.0 | [Web guidance wrapper](../../scripts/web-guidance.mjs) |
| [Bergside TypeUI DESIGN.md Style Extractor](https://github.com/bergside/design-md-chrome) | Complete tracked source at `8e07614fb18752ab1ee14dd65a8ff93e63c9b13b` | MIT | [URL extractor](../../scripts/design-md.mjs) and [unpacked Chrome extension](design-md-chrome/README.md) |

The npm distribution contains the built CLI and guide index in addition to the source guidance. Its npm integrity is `sha512-ksFBCdzMl5xxf7wuF7XQbudQ6El1e2VrO0WzcH/U29NYGNzu0EZjtojkfwzFBSnmenDyl7QIwPCgYvfEmZHr+w==`. Both upstream licenses are available in their source directories. The wrappers live outside these vendored sources.
