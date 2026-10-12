import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

// Import eslint-config-next's native flat-config arrays directly.
// Do NOT go back to FlatCompat({...}).extends('next/core-web-vitals', ...):
// FlatCompat routes the resolved config through @eslint/eslintrc's legacy
// schema validator, which JSON.stringify's the config on any validation path.
// eslint-plugin-react-hooks self-references its own plugin object inside
// configs.recommended.plugins, making that object circular — so FlatCompat
// crashes every `npm run lint` with "Converting circular structure to JSON".
// Reproduces on the pinned eslint-config-next@16.1.6 + eslint@9.39.4; it is
// not caused by a version bump, and these subpaths need no bump to fix it.
const eslintConfig = [
  // The ./core-web-vitals and ./typescript subpaths do NOT carry the global
  // ignores that eslint-config-next's default export appends, so declare them
  // here — otherwise ESLint walks .next/ build output (~18k generated findings).
  // '.claude/**' holds full repo copies created by Claude Code worktree sessions;
  // without it ESLint walks those vendored trees and reports ~18k findings that
  // have nothing to do with this project's source.
  { ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts', '.claude/**'] },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      // This site's terminal aesthetic renders literal "// eyebrow" strings as
      // visible UI ("// weekly insights", "// runtime_error", "// error_404").
      // The rule reads that leading slash-slash as a mis-written JS comment, so
      // every one of those labels is a false positive here — and "fixing" them
      // by wrapping in {/* */} would silently delete real on-screen text.
      'react/jsx-no-comment-textnodes': 'off',
    },
  },
  {
    // These are one-off CLI maintenance scripts; printing to stdout is the point.
    files: ['scripts/**'],
    rules: { 'no-console': 'off' },
  },
];

export default eslintConfig;
