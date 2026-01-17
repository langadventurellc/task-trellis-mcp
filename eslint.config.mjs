import js from '@eslint/js';
import {
  multipleExportsPlugin,
  statementCountPlugin,
} from '@langadventurellc/tsla-linter';
import prettierConfig from 'eslint-config-prettier';
import sonarjs from 'eslint-plugin-sonarjs';
import { dirname } from 'path';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [
  // Ignore patterns
  {
    ignores: [
      '**/node_modules/**',
      '**/coverage/**',
      '**/dist/**',
      '**/scratch/**',
      '**/template/**',
    ],
  },

  // Base configurations
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Main configuration for TypeScript files with type checking
  ...tseslint.configs.recommendedTypeChecked.map(config => ({
    ...config,
    files: ['**/*.ts'],
  })),
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      'statement-count': statementCountPlugin,
      'multiple-exports': multipleExportsPlugin,
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // General rules (formatting rules removed - handled by Prettier)
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'max-lines': ['warn', { max: 600, skipBlankLines: true }],
      "statement-count/function-statement-count-warn": "warn",
      "statement-count/function-statement-count-error": "error",
      "statement-count/class-statement-count-warn": "warn",
      "statement-count/class-statement-count-error": "error",
      "multiple-exports/no-multiple-exports": [
        "error",
        {
          checkClasses: true,
          checkFunctions: true,
          checkInterfaces: true,
          checkTypes: true,
          checkVariables: true,
          excludeConstants: true,
          ignoreBarrelFiles: true,
        },
      ],
    },
  },

  // SonarJS configuration
  {
    ...sonarjs.configs.recommended,
    ignores: ['src/__tests__/**'],
    rules: {
      'sonarjs/deprecation': 'warn',
    },
  },

  // Configuration for test files
  {
    files: ['**/*.test.{ts,tsx,js,jsx}', '**/__tests__/**/*'],
    rules: {
      'no-console': 'off',
      'max-lines': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/unbound-method': 'off',
      "statement-count/function-statement-count-warn": "off",
      "statement-count/function-statement-count-error": "off",
      "statement-count/class-statement-count-warn": "off",
      "statement-count/class-statement-count-error": "off",
    },
  },

  // Prettier integration - must be last to override other configs
  prettierConfig,
];

export default eslintConfig;
