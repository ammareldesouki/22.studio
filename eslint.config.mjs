// Root ESLint flat config — re-exports the single shared preset (FR-009: config defined once).
// `eslint .` run from any workspace package walks up to this file.
export { default } from './packages/config/eslint.config.mjs';
