# npm Supply Chain Hardening

> Research Date: 2026-05-14
> Related Code: `package.json`, `package-lock.json`, `.npmrc`
> Status: Active

## Background

The local audit found 10 transitive dependency advisories across the CLI toolchain:
5 high and 5 moderate. The vulnerable packages came through `incur`,
`vitest`, and `tsup`, not through first-party runtime code.

Recent npm ecosystem attacks make lockfile updates alone insufficient. On
2026-05-11, the TanStack npm compromise published malicious packages that ran
during install and attempted credential theft. The attack combined
`pull_request_target`, cache poisoning, and OIDC token extraction from a
GitHub Actions runner. Some malicious packages had valid provenance, so
provenance is useful but not a complete defense.

## Findings

| Finding | Implication |
| --- | --- |
| Audit advisories were all fixable without direct major upgrades. | Use `npm audit fix` to refresh transitive patched versions. |
| The TanStack attack executed during package installation. | Lifecycle scripts are a major risk surface; review them before introducing packages that require install scripts. |
| Newly published malicious versions were detected within hours. | A release-age cooldown reduces exposure to short-lived malicious releases. |
| npm registry signatures and attestations can be checked locally. | Add a repeatable audit command that checks both advisories and package integrity metadata. |

## Applied Controls

1. Updated the lockfile with patched transitive versions:
   `@hono/node-server`, `hono`, `express-rate-limit`, `ip-address`,
   `fast-uri`, `path-to-regexp`, `picomatch`, `postcss`, `vite`, and `yaml`.
2. Replaced `package-lock.json` with `npm-shrinkwrap.json` so the audited
   dependency tree can be included when publishing this CLI package.
3. Added `.npmrc` with:
   - `audit=true`
   - `package-lock=true`
   - `save-exact=true`
   - `min-release-age=7`
4. Added `security:audit`:
   `npm audit --audit-level=moderate && npm audit signatures`.
5. Declared `npm >=11.10.0` in `engines` because `min-release-age` requires a
   recent npm CLI. The local npm bundled with Node may warn until upgraded.

## Operational Notes

- Prefer `npm ci` in CI and release jobs so installs match `package-lock.json`.
- Run `npm run security:audit` before publishing.
- If an incident notice says a dependency version was malicious during a known
  install window, rotate credentials exposed to that host even if `npm audit`
  later reports clean.
- Do not enable project-wide `ignore-scripts=true` yet: this project uses
  `tsup`, which depends on `esbuild`, and fresh installs may rely on
  `esbuild`'s install hook. Revisit with an allow-list approach if CI supports
  it.

## References

- TanStack postmortem: https://tanstack.com/blog/npm-supply-chain-compromise-postmortem
- Snyk analysis: https://snyk.io/blog/tanstack-npm-packages-compromised/
- npm audit signatures docs: https://docs.npmjs.com/cli/v11/commands/npm-audit/
- npm `min-release-age` config: https://docs.npmjs.com/cli/v11/using-npm/config#min-release-age
- npm trusted publishing docs: https://docs.npmjs.com/trusted-publishers/
- OpenAI incident response note: https://openai.com/index/our-response-to-the-tanstack-npm-supply-chain-attack/
