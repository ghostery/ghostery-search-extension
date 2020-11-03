# ghostery-search-extension

## Publishing

 1. Update version in `src/manifest.json`
 2. `git add src/manifest.json && git commit -m "v$VERSION"`
 2. `npm run build`
 3. `gh release create v$VERSION ./web-ext-artifacts/ghostery_search-$VERSION.zip` (replace `$VERSION` with the manifest version)
