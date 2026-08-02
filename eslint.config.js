// Configuración de ESLint (flat config, ESLint 9) para el proyecto.
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');

module.exports = [
  {
    ignores: ['node_modules/**', '.expo/**', 'coverage/**', 'public/**', 'babel.config.js', 'eslint.config.js'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      // El proyecto usa `any` puntualmente en tipos de terceros (theme);
      // se corrige en el refactor pero no se bloquea el lint por eso.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-unused-vars': 'off',
    },
  },
];
