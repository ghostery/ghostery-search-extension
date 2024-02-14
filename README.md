# Ghostery Private Search Extension

Makes ghosterysearch.com a default search engine.

## Multiple platform support

WebExtensions are supported by most modern browsers. For each browser we ship exactly same code base but with different manifest.

Manifests are located in `/manifests` folder. To prepare the build for different platform copy the right manifest into `/src` folder or user `npm run switch-<PLATFORM>` scripts. Supported platforms are:
* Ghostery Private Browser `npm run switch-ghostery`
* Firefox `npm run switch-firefox`
* Chromium - `npm run switch-chrome`

*Important* - remember to copy manifest file on every change you make to it in `/manifests` folder. `/src/manifest.json` is not updating automatically.

## Publishing builds to github releases

Update `version` in `package.json`

```sh
npm run release
```
