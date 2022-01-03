/* eslint-disable node/no-extraneous-require */

module.exports = {
  root: true,
  ...require('fabscale-eslint-config/lib/ember'),

  overrides: [
    // typescript files
    {
      files: ['./**/*.ts'],
      ...require('fabscale-eslint-config/lib/ember-ts'),
    },

    // node files
    {
      files: [
        './*.js',
        './blueprints/*/index.js',
        './config/**/*.js',
        './lib/**/*.js',
        './tests/dummy/config/**/*.js',
      ],
      ...require('fabscale-eslint-config/lib/node'),
    },
    {
      // test files
      files: ['tests/**/*-test.{js,ts}'],
      ...require('fabscale-eslint-config/lib/ember-tests'),
    },
  ],
};
