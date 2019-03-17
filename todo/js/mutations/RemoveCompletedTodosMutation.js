/**
 * This file provided by Facebook is for non-commercial testing and evaluation
 * purposes only.  Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {
  commitMutation,
  graphql,
} from 'react-relay';
import {ConnectionHandler} from 'relay-runtime';

const mutation = graphql`
  mutation RemoveCompletedTodosMutation($input: RemoveCompletedTodosInput!) {
    removeCompletedTodos(input: $input) {
      removedTodos {
        id
      },
      user {
        completedCount,
        totalCount,
      },
    }
  }
`;

function sharedUpdater(store, user, deletedNodes) {
  const userProxy = store.get(user.id);
  const conn = ConnectionHandler.getConnection(
    userProxy,
    'TodoList_todos',
  );
  deletedNodes.forEach((node) =>
    ConnectionHandler.deleteNode(conn, node.id)
  );
}

function commit(
  environment,
  todos,
  user,
) {
  return commitMutation(
    environment,
    {
      mutation,
      variables: {
        input: {},
      },
      updater: (store) => {
        const payload = store.getRootField('removeCompletedTodos');
        sharedUpdater(store, user, payload.getLinkedRecords('removedTodos').map((record) => ({
          id: record.getValue('id')
        })));
      },
      optimisticUpdater: (store) => {
        if (todos && todos.edges) {
          const deletedIDs = todos.edges
            .filter(edge => edge.node.complete)
            .map(edge => edge.node);
          sharedUpdater(store, user, deletedIDs);
        }
      },
    }
  );
}

export default {commit};
