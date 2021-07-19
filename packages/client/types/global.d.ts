// Types for compiled templates
declare module 'ember-graphql-client/templates/*' {
  import { TemplateFactory } from 'htmlbars-inline-precompile';
  const tmpl: TemplateFactory;
  export default tmpl;
}

declare module '*.graphql' {
  import { DocumentNode } from 'graphql';
  let content: DocumentNode;
  export default content;
}
