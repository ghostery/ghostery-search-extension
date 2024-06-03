const { execSync } = require("child_process");
const fs = require("node:fs");

const sh = (cmd) => execSync(cmd, { stdio: "inherit" });

const VERSION = require("../package.json").version;
const MANIFEST_PATH = "./src/manifest.json";

const updateManifest = () => {
  const manifest = JSON.parse(
    fs.readFileSync(MANIFEST_PATH, { encoding: "utf8" }),
  );
  manifest.version = VERSION;
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
};

const artifacts = [];

sh(`npm run switch-firefox`);
updateManifest();
sh("npm run build");
artifacts.push(
  `./web-ext-artifacts/ghostery_private_search_for_firefox-${VERSION}.zip`,
);

sh(`npm run switch-chrome`);
updateManifest();
sh("npm run build");
artifacts.push(
  `./web-ext-artifacts/ghostery_private_search_for_chrome-${VERSION}.zip`,
);

sh(`gh release create v${VERSION} ${artifacts.join(" ")}`);
