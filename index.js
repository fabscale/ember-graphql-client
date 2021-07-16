'use strict';

const GraphQLFilter = require('broccoli-graphql-filter');

module.exports = {
  name: require('./package').name,

  options: {
    '@embroider/macros': {
      setOwnConfig: {
        enableMocks:
          process.env.MOCK_GRAPHQL && process.env.MOCK_GRAPHQL !== 'false',
      },
    },
  },

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
