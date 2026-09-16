import root from '../../eslint.config.mjs';

// apps/web currently lints with the workspace rules only.
// -----------------------------------------------------------------------
// It used to run `next lint` with `extends: ["next/core-web-vitals"]`.
// Neither works on ESLint 9, which this repository declares:
//
//   next lint           → Invalid Options: 'useEslintrc', 'extensions',
//                         'rulePaths' … removed in ESLint 9
//   FlatCompat bridge   → TypeError: context.getScope is not a function
//                         Rule: "react-hooks/rules-of-hooks"
//                       → TypeError: context.getAncestors is not a function
//                         Rule: "@next/next/no-duplicate-head"
//
// Both the react-hooks plugin and the @next/next plugin bundled with
// eslint-config-next@14 call rule-context methods ESLint 9 removed, so
// they crash the run instead of reporting. Disabling them one at a time
// leaves almost nothing of the config, so the bridge was dropped rather
// than hollowed out.
//
// WHAT THIS COSTS: no next/no-img-element, no next/no-html-link-for-pages,
// no react-hooks/exhaustive-deps. TypeScript and the workspace rules still
// apply to every file here.
//
// THE FIX is to upgrade eslint-config-next to a release that supports
// ESLint 9 (Next 15's), which is a dependency change with its own
// compatibility surface — not something to slip into a pipeline repair.
// Recorded in docs/TESTING.md.
export default root;
