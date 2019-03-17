import {
  GraphQLString,
  GraphQLBoolean,
  GraphQLObjectType,
  GraphQLList,
  GraphQLInputObjectType,
  GraphQLNonNull,
} from 'parse-server/lib/graphql/index';

async function updateCounts(user, plusOne = false) {
  let totalCount = plusOne ? 1 : 0;
  let completedCount = 0;
  await user.relation('todos').query().each(todo => {
    totalCount++;
    if (todo.get('complete') === true) {
      completedCount++;
    }
  });
  console.log({ totalCount, completedCount });
  user.save({
    totalCount,
    completedCount
  }, { useMasterKey: true })
}


Parse.Cloud.beforeSave('Todo', async (req) => {
  const user = req.user;
  if (!req.object.get('user')) {
    req.context.isFirstSave = true;
  }
  // Set complete as false
  if (typeof req.object.get('complete') !== 'boolean') {
    req.object.set('complete', false);
  }
  await updateCounts(user, true);
  req.object.set('user', user);
});

Parse.Cloud.afterSave('Todo', async (req) => {
  const user = req.user;
  if (req.context.isFirstSave) {
    user.relation('todos').add(req.object);
  }
  await user.save(null, { useMasterKey : true });
});

Parse.Cloud.beforeDelete('Todo', async (req) => {
  await updateCounts(req.user);
});

Parse.Cloud.define('markAllTodos', {
  type: () => {
    return new GraphQLObjectType({
      name: 'MarkAllTodosPayload',
      fields: {
        changedTodos: { type: new GraphQLList(Parse.Cloud.GraphQLUtils.getObjectType('Todo')) },
        user: { type: Parse.Cloud.GraphQLUtils.getObjectType('_User') },
        clientMutationId: { type: GraphQLString }
      }
    });
  },
  inputType: new GraphQLInputObjectType({
    name: 'MarkAllTodosInput',
    fields: {
      complete: { type: new GraphQLNonNull(GraphQLBoolean) },
      clientMutationId: { type: GraphQLString }
    }
  }),
  handler: async (req) => {
    const query = new Parse.Query('Todo');
    const changedTodos = [];
    await query.each((todo) => {
      if (todo.get('complete') != req.params.complete) {
        changedTodos.push(todo);
        todo.set('complete', req.params.complete);
        return todo.save();
      }
    });
    await updateCounts(req.user);
    return {
      changedTodos,
      user: req.user,
      clientMutationId: req.params.clientMutationId,
    }
  }, 
});

Parse.Cloud.define('removeCompletedTodos', {
  type: new GraphQLObjectType({
    name: 'RemoveCompletedTodosPayload',
    fields: () => ({
      removedTodos: { type: new GraphQLList(Parse.Cloud.GraphQLUtils.getObjectType('Todo')) },
      user: { type: Parse.Cloud.GraphQLUtils.getObjectType('_User') },
      clientMutationId: { type: GraphQLString }
    })
  }),
  inputType: new GraphQLInputObjectType({
    name: 'RemoveCompletedTodosInput',
    fields: {
      clientMutationId: { type: GraphQLString }
    }
  }),
  handler: async (req) => {
    const removedTodos = [];
    const query = req.user.relation('todos').query();
    query.equalTo('complete', true);
    await query.each((todo) => {
      removedTodos.push(todo);
      return todo.destroy();
    });
    return {
      removedTodos,
      user: req.user.fetch(),
      clientMutationId: req.params.clientMutationId,
    }
  }, 
});
