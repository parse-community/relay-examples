import ParseServer from 'parse-server';

export default new ParseServer({
  appId: 'hello',
  masterKey: 'world',
  enableGraphiQL: true,
  cloud: './cloud/main',
  databaseURI: 'mongodb://admin:stup1dp4sswordhorse@ds129762.mlab.com:29762/test-graphql',
});
