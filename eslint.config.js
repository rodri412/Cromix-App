const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/**', '.expo/**', 'assets/CassetteBase64.js', 'supabase/functions/**'] },
  { files: ['src/components/three/*.tsx'], rules: { 'react/no-unknown-property': 'off' } },
]);
