const baseRules = {
  'prefer-const': 0,
  'ember/no-deeply-nested-dependent-keys-with-each': 2,
  'ember/no-ember-super-in-es-classes': 2,
  'ember-es6-class/no-object-extend': 2,
  'no-console': 2,
  'ember/no-invalid-debug-function-arguments': 2,
  'ember/require-return-from-computed': 2,
  'ember/no-new-mixins': 2,
  'ember/no-jquery': 2,
  'ember/route-path-style': 2,
  'ember/prefer-ember-test-helpers': 2,
  'ember/no-replace-test-comments': 2,

  'lines-between-class-members': [
    'error',
    'always',
    { exceptAfterSingleLine: true },
  ],
};

module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      legacyDecorators: true,
    },
  },

  plugins: ['ember', 'ember-es6-class'],

  extends: [
    'eslint:recommended',
    'plugin:ember/recommended',
    'plugin:prettier/recommended',
  ],

  env: {
    browser: true,
  },

  rules: baseRules,

  overrides: [
    // .ts files
    {
      parser: '@typescript-eslint/parser',
      files: ['**/*.ts'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:ember/recommended',
        'plugin:prettier/recommended',
      ],

      rules: Object.assign(
        {
          // Typescript-specific
          '@typescript-eslint/no-explicit-any': 0,
          '@typescript-eslint/ban-ts-comment': 0,
          '@typescript-eslint/no-non-null-assertion': 0,
        },
        baseRules
      ),
    },

    // node files
    {
      files: [
        '.eslintrc.js',
        '.prettierrc.js',
        '.template-lintrc.js',
        'ember-cli-build.js',
        '.ember-cli.js',
        'testem.js',
        'config/**/*.{js,ts}',
        'lib/*/index.{js,ts}',
        '.release/*.js',
        'tests/dummy/config/*.js',
        'index.js',
      ],

      excludedFiles: ['app/**'],

      parserOptions: {
        sourceType: 'script',
      },

      env: {
        browser: false,
        node: true,
      },

      plugins: ['node'],
      extends: ['plugin:node/recommended'],
      rules: {
        // this can be removed once the following is fixed
        // https://github.com/mysticatea/eslint-plugin-node/issues/77
        'node/no-unpublished-require': 'off',
      },
    },
    {
      // Test files:
      files: ['tests/**/*-test.{js,ts}'],
      extends: ['plugin:qunit/recommended'],
      rules: {
        'ember/avoid-leaking-state-in-ember-objects': 0,
        '@typescript-eslint/no-empty-function': 0,
      },
    },
  ],
};
