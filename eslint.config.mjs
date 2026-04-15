import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import eslintConfigPrettier from 'eslint-config-prettier'
// import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss'
import perfectionist from 'eslint-plugin-perfectionist'
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended'
import unusedImports from 'eslint-plugin-unused-imports'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'
import { parser as eslintParserTypeScript } from 'typescript-eslint'

export default defineConfig([
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts', '.claude/**'],
  },
  ...nextVitals,
  ...nextTs,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  eslintPluginPrettier,
  // { extends: [eslintPluginBetterTailwindcss.configs.recommended] },
  // {
  //   settings: {
  //     'better-tailwindcss': {
  //       entryPoint: 'src/app/globals.css',
  //     },
  //   },
  // },
  {
    files: ['**/*.{ts,tsx,cts,mts}'],
    languageOptions: {
      parser: eslintParserTypeScript,
      parserOptions: {
        project: true,
      },
    },
  },

  {
    files: ['**/*.{jsx,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'react/button-has-type': 'error',
      'react/jsx-curly-brace-presence': [
        'error',
        { children: 'never', propElementValues: 'always', props: 'never' },
      ],
      'react/jsx-no-useless-fragment': 'error',
      'react/jsx-sort-props': [
        'warn',
        {
          callbacksLast: true,
          ignoreCase: true,
          reservedFirst: true,
          shorthandLast: true,
        },
      ],
      'react/jsx-uses-react': 'off',
      'react/no-array-index-key': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/self-closing-comp': 'error',
    },
  },
  {
    plugins: {
      perfectionist,
      'unused-imports': unusedImports,
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { disallowTypeAnnotations: false, prefer: 'type-imports' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
        },
      ],
      'arrow-body-style': ['error', 'as-needed'],
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always'],
      'func-style': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'import/order': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-lonely-if': 'error',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              message:
                'Use next/navigation (App Router) instead of next/router.',
              name: 'next/router',
            },
            {
              importNames: ['default'],
              message:
                'Default React import is not needed in modern JSX runtimes.',
              name: 'react',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'warn',
        {
          message:
            'Avoid redundant primitive generic in hooks; type is inferred.',
          selector:
            'CallExpression[callee.name=/^use/] > TSTypeParameterInstantiation > :matches(TSBigIntKeyword, TSBooleanKeyword, TSNullKeyword, TSNumberKeyword, TSStringKeyword, TSSymbolKeyword, TSUndefinedKeyword)',
        },
        {
          message:
            'Avoid `export default` on function declarations. Use named exports.',
          selector: 'ExportDefaultDeclaration > FunctionDeclaration',
        },
      ],
      'no-self-compare': 'error',
      'no-template-curly-in-string': 'error',
      'no-useless-rename': 'error',
      'object-shorthand': ['error', 'always'],
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', next: '*', prev: 'directive' },
        { blankLine: 'any', next: 'directive', prev: 'directive' },
        { blankLine: 'always', next: 'return', prev: '*' },
        { blankLine: 'always', next: 'if', prev: '*' },
        { blankLine: 'always', next: '*', prev: 'if' },
        { blankLine: 'always', next: 'for', prev: '*' },
        { blankLine: 'always', next: 'while', prev: '*' },
        { blankLine: 'always', next: 'do', prev: '*' },
        { blankLine: 'always', next: '*', prev: 'do' },
        { blankLine: 'always', next: 'switch', prev: '*' },
        { blankLine: 'always', next: '*', prev: 'switch' },
        { blankLine: 'always', next: 'try', prev: '*' },
        { blankLine: 'always', next: '*', prev: 'try' },
        { blankLine: 'always', next: 'with', prev: '*' },
        { blankLine: 'always', next: '*', prev: 'with' },
      ],
      'perfectionist/sort-enums': 'error',
      'perfectionist/sort-imports': [
        'error',
        {
          groups: [
            'type',
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          type: 'natural',
        },
      ],
      'prefer-template': 'error',
      quotes: ['error', 'single', { avoidEscape: true }],
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
])
