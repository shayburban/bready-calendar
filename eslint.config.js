import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import schedulingTimekit from './eslint-rules/no-raw-time.js'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  // T1 — TimeKit substrate enforcement, scoped to the scheduling module only
  // (§10.3/R24). timekit.js is the sanctioned substrate; __tests__ build raw
  // fixtures; legacy code outside src/lib/scheduling is intentionally untouched.
  {
    files: ['src/lib/scheduling/**/*.{js,jsx}'],
    ignores: ['src/lib/scheduling/timekit.js', 'src/lib/scheduling/**/__tests__/**'],
    plugins: { 'scheduling-timekit': schedulingTimekit },
    rules: {
      'scheduling-timekit/no-raw-time': 'error',
    },
  },
]
