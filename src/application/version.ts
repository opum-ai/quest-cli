/**
 * The Quest CLI's reported version.
 *
 * The bare semver literal below is the release version, hand-edited on a bump
 * alongside `package.json`. A platform build injects `__QUEST_BUILD_VERSION__`
 * (derived from `git describe` in `scripts/build-platform-packages.mjs`) so a
 * checkout carrying commits beyond the last release tag reports a
 * distinguishable dev version. Where the injected global is absent -- `bun
 * test`, `bun run src/cli/main.ts` -- the bare literal is reported, so the
 * dev-runtime and in-process value stays exactly the version this file names.
 */
declare const __QUEST_BUILD_VERSION__: string;
export const QUEST_VERSION: string =
  typeof __QUEST_BUILD_VERSION__ === "string"
    ? __QUEST_BUILD_VERSION__
    : "0.12.0";
