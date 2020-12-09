import _ from 'lodash';

const cellSetsDelete = (state, action) => {
  const { key } = action.payload;

  const newState = _.cloneDeep(state);

  // Modify hierarchy to remove the cell set.
  newState.hierarchy = newState.hierarchy.filter((rootNode) => {
    // If it's a root we're removing, delete all its children.
    if (rootNode.key === key) {
      // eslint-disable-next-line no-unused-expressions
      rootNode.children?.forEach((child) => {
        delete newState.properties[child.key];
      });

      return false;
    }

    if (rootNode.children) {
      // eslint-disable-next-line no-param-reassign
      rootNode.children = rootNode.children.filter((child) => child.key !== key);
    }

    return true;
  });

  // Delete from the properties as well.
  delete newState.properties[key];

  // If the key was in the list of selected keys, make sure we remove it from there.
  newState.selected = newState.selected.filter((selectedKey) => selectedKey !== key);

  // Delete from hidden if it was selected to be hidden.
  newState.hidden.delete(key);

  return newState;
};

export default cellSetsDelete;
