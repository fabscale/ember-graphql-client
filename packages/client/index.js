'use strict';

const GraphQLFilter = require('broccoli-graphql-filter');

module.exports = {
  name: require('./package').name,

  setupPreprocessorRegistry(type, registry) {
    if (type === 'parent') {
      registry.add('js', {
        name: require('./package').name,
        ext: 'graphql',
        toTree(tree) {
          return new GraphQLFilter(tree, {
            keepExtension: true,
          });
        },
      });
    }
  },
};
