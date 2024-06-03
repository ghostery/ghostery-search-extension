# Ghostery Private Search Extension

Makes ghosterysearch.com a default search engine.

## Multiple platform support

WebExtensions are supported by most modern browsers. For each browser we ship exactly same code base but with different manifest.

Manifests are located in `/manifests` folder. To prepare the build for different platform copy the right manifest into `/src` folder or user `npm run switch-<PLATFORM>` scripts. Supported platforms are:
* Firefox `npm run switch-firefox`
* Chromium - `npm run switch-chrome`

*Important* - remember to copy manifest file on every change you make to it in `/manifests` folder. `/src/manifest.json` is not updating automatically.

## Publishing

 1. Update version in `src/manifest.json`
 2. `git add src/manifest.json && git commit -m "v$VERSION"`
 2. `npm run build`
 3. `gh release create v$VERSION ./web-ext-artifacts/ghostery_search-$VERSION.zip` (replace `$VERSION` with the manifest version)
