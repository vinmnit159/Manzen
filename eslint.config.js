import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['dist/**', 'coverage/**', 'playwright-report/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        document: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        localStorage: 'readonly',
        navigator: 'readonly',
        sessionStorage: 'readonly',
        window: 'readonly',
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Surface any usage as warnings — too many to fix at once but must be visible
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Upgrade exhaustive-deps from the plugin default (warn) to error
      // so missing hook dependencies are caught before they reach review
      'react-hooks/exhaustive-deps': 'error',
      'no-case-declarations': 'off',
      'no-undef': 'off',
    },
  },
  prettier,
);
