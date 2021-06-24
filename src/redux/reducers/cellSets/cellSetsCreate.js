import _ from 'lodash';

const cellSetsCreate = (state, action) => {
  const {
    key, name, color, cellIds, type,
  } = action.payload;
  const newState = _.cloneDeep(state);

  newState.hierarchy = newState.hierarchy && newState.hierarchy.map((rootNode) => {
    if (rootNode.key === 'scratchpad') {
      // eslint-disable-next-line no-param-reassign
      rootNode.children = rootNode.children || [];
      rootNode.children.push({ key });
    }

    return rootNode;
  });

  newState.properties[key] = {
    key, name, color, cellIds: new Set(cellIds), type,
  };

  return newState;
};

export default cellSetsCreate;
