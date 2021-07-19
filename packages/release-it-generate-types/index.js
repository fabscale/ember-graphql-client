const { Plugin } = require('release-it');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

module.exports = class ReleateItGenerateTypesPlugin extends Plugin {
  beforeRelease() {
    console.log('RUN NOW!!!');
    return exec('cd packages/client && yarn prepack');
  }

  afterRelease() {
    console.log('CLEANUP!');
    return exec('cd packages/client && yarn postpack');
  }
};
