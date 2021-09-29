import { createHierarchyFromTree, createPropertiesFromTree } from './helpers';

const cellSetsLoaded = (state, action) => {
  const { data, order } = action.payload;
  const newState = {
    ...state,
    loading: false,
    hierarchy: createHierarchyFromTree(data, order),
    properties: createPropertiesFromTree(data),
  };
  return newState;
};

export default cellSetsLoaded;
