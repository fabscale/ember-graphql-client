const { Plugin } = require('release-it');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

module.exports = class ReleateItGenerateTypesPlugin extends Plugin {
  async beforeRelease() {
    this.log.info('Generating types to publish to npm...');
    await exec('cd packages/client && yarn ts:precompile');
    await exec('cd packages/mock && yarn ts:precompile');
    this.log.info('Types generated successfully!');
  }

  async afterRelease() {
    this.log.info('Cleaning generated types...');
    await exec('cd packages/client && yarn ts:clean');
    await exec('cd packages/mock && yarn ts:clean');
  }
};
