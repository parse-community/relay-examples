#!/usr/bin/env babel-node
import Parse from 'parse/node';
import fs from 'fs';
import path from 'path';
import { printSchema } from 'graphql';
import parseServer from '../parseServer';
import ParseServer from 'parse-server';

const schemaPath = path.resolve(__dirname, '../data/schema.graphql');

parseServer.start({ mountPath: '/parse' }, async () => {
  console.log('server started...');
  try {
    // Create a Todo class, with all three required parameters
    const todoSchema = new Parse.Schema('Todo');
    todoSchema.addField('text', 'String');
    todoSchema.addField('complete', 'Boolean');
    todoSchema.addPointer('user', '_User');
    await todoSchema.save();
  } catch (e) { /**/ }
  try {
    // Update the User schema with the counts
    const userSchema = new Parse.Schema('_User');
    userSchema.addRelation('todos', 'Todo');
    userSchema.addField('completedCount', 'Number');
    userSchema.addField('totalCount', 'Number');
    await userSchema.update();
  } catch (e) { /**/ }

  const { schema } = await ParseServer.getGraphQLSchema();
  fs.writeFileSync(schemaPath, printSchema(schema));
  console.log(`Wrote ${schemaPath}`);
  process.exit(0);
});
