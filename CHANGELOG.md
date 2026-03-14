# Changelog

## [1.0.7] - 2026-03-14

### Added

- **Inline Spans** (`TextLayer.spans`): Render mixed-style text within a single layer.
  Each span supports `bold`, `italic`, `color`, `fontSize`, and `highlight` overrides.
  Line breaks via `\n` within span text are fully supported.
- **fontUrl auto-fetch & cache**: When `fontUrl` starts with `https://`, the font binary
  is automatically downloaded and cached in `os.tmpdir()`. Google Fonts CSS URLs
  (`fonts.googleapis.com/css*`) are parsed to extract the actual font binary URL.
- `TextSpan` interface exported from `types.ts`.

### Changed

- Font injection switched from `@import url()` to `@font-face { src: url() }` for
  better librsvg compatibility with local files.

### Fixed

- `fontUrl: 'https://...'` now works correctly (previously failed due to librsvg
  blocking external network requests).
