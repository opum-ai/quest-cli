---
# yaml-language-server: $schema=../../.lore/schemas/reference.schema.json
type: Reference
title: Quest CLI release truth
tags:
  - quest
  - cli
  - release
  - publication
summary: Immutable publication and public-registry verification evidence for Quest CLI 0.1.0.
timestamp: 2026-08-17T05:49:03.883Z
---

# Quest CLI release truth

`@opum-ai/quest` 0.1.0 is publicly published on npm. This is the immutable
release record for the root launcher and its six platform packages; it does
not claim that a later source tree or a locally rebuilt artifact is released.

## Release identity

- npm package: `@opum-ai/quest@0.1.0`, dist-tag `latest` = `0.1.0`.
- Repository: `https://github.com/opum-ai/quest-cli.git`.
- Reviewed source commit: `f89ad168515b9ae811d2bf0d6a54c2a5a7f58d37`
  (PR #104 merge to `dev`).
- Qualification: GitHub Actions prepublication run `31977086471` passed its
  source gates and every immutable native candidate: darwin, linux, and
  win32 on arm64 and x64.
- Publication authority: the owner explicitly authorized QCLI-95 on
  2026-08-17. The package was published only after a fresh registry-name,
  repository-identity, Lore release, metadata, and checksum recheck.

## Immutable artifacts

The following SHA-256 values identify the tarballs supplied to npm. The npm
`dist.shasum` and `dist.integrity` observations matched the values generated
for those tarballs at publication.

| Package | Tarball SHA-256 | npm integrity |
| --- | --- | --- |
| `@opum-ai/quest@0.1.0` | `4207136eea13f9c9813a524e46f3636b6cee4515c72c0593433cdb9841e4fb82` | `sha512-146jnw6PPsuB/P3iZesuDH1CKrZB3aow3WjYWxU3Y7IVP2zI19xd6fWBKyF96gbC52T86NWQdDeftxvsurU4sQ==` |
| `@opum-ai/quest-darwin-arm64@0.1.0` | `6c0ada5be7a5dde52f051778d244fcefe70e421a87981c002b48be4824052af3` | `sha512-2l3oMriTyXl7N4RZeoXkuQ0DY6r7/mAf3DNcvcYvNLrLo/L2z54vA+fb8g7G4cRqeu5bEIidI72mYTB0joCOrg==` |
| `@opum-ai/quest-darwin-x64@0.1.0` | `89039629c950a4183bf69a979de77bccebade7c2b8b4259100511821e9534bd9` | `sha512-v40hRHzGPDL7laW7fcYhJGQAWCBGr+gGV2Wwze7tzFK1UJuRxEF+1ZA0S3AJhzIPilvusTewg+g9ATtsL0WW8w==` |
| `@opum-ai/quest-linux-arm64@0.1.0` | `b77707dfd5cd0e7371e3849c730efb7320742426db2536c68843380c88e6ae00` | `sha512-mFMiLe0m94k3tAmpFj7ETBSBLx9mmr3nNT7rYxFgZ4wwpNbRb2AJQgNCzJJ4WGyi9G6roL6Ow9J2ZGardJVxZA==` |
| `@opum-ai/quest-linux-x64@0.1.0` | `905eba2b2e47314f8c5fa025b74b930da61bda8f181512ae3fb373e8dbb24a8a` | `sha512-T+29LB0EdRoUk0uZzCyH/bMA15QbymyFW3R6vySkjX3fPErCNbdnVtn2BS42qJO4GrSQgaLiGQKlOHvmOFEo5Q==` |
| `@opum-ai/quest-win32-arm64@0.1.0` | `683dce29320475c67907938748e6646b0126eef21a56d52751e0bac115f0d1b0` | `sha512-0wkzENRukZwp1r1lrZBucEA7hVl3nUaliySLshw/G4sZk3+PcD83LpwtmCImx78WeidUIvVTl3JEE5FQEeyc2Q==` |
| `@opum-ai/quest-win32-x64@0.1.0` | `491008a2938feb107ba2bb9fdcd735863daf3d3814d7a52d37fca2ac5b07c531` | `sha512-YquRERVf3tRzzR5BzdUN0L8ZAkm27z+dq0Z3Anh8d4f3/Z76ufZ4uRJhfC8O+zFuI7pKM45XQZqLp+BrNRbXdA==` |

The published platform binary SHA-256 values match the root launcher's pinned
platform map: darwin-arm64 `62af021a1efcdab9600e4e066f3593fd35f8c1aa19d0a003d388d1f8d93e4e2c`,
darwin-x64 `f1cfbede30b2ec1a4588c7b5150d6741e6f0fd5aab8bf15df69250f4a26baa93`,
linux-arm64 `4ca3d2902029271d5d1ed209e77c358b4f01014ec8ed759e8c3ddf94c908008c`,
linux-x64 `17fbbda05cf8fcf7652cb19c37aee90630b9c048a8fff332a5c37cc706c7f847`,
win32-arm64 `8a9b0a21921b02dbb60fb5abb214d69ee1c67ab152a1c4ef6081231292c9609d`,
and win32-x64 `50d84e1b1d43469fbcc2564e62cb00b7bc14e87594acf0df0b938b3ce689d3f4`.

## Registry verification

A clean temporary install of `@opum-ai/quest@0.1.0` fetched the published
darwin-arm64 package; its installed native binary matched the pinned SHA-256.
The installed launcher then passed `--version`, `manifest --json`, an
actor-declared `task create` plus `task list`, `sqlite-smoke --json`, and
`migration-smoke --json`. The latter reported `removed: 1`. The other five
registry platform tarballs have the same integrity values as the six candidate
artifacts that passed the cross-platform qualification run above.

## Install

Install the public launcher with:

```sh
npm install --global @opum-ai/quest@0.1.0
quest --version
```

If a platform package cannot be selected for the current OS/CPU, Quest reports
the missing optional package rather than substituting a different native
artifact.
