/**
 * Conventional Commits config for ORBLOX.
 * Allowed types: feat, fix, refactor, docs, style, perf, test, build, ci, chore, revert.
 *
 * Examples:
 *   feat(catalog): add gamepass calculator
 *   fix(checkout): handle expired midtrans token
 *   chore(deps): bump prisma to 7.8.1
 */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "subject-case": [0],
    "header-max-length": [2, "always", 100],
  },
};
