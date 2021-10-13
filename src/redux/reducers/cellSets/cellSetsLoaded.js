import { createHierarchyFromTree, createPropertiesFromTree } from './helpers';

const cellSetsLoaded = (state, action) => {
  const { data } = action.payload;
  const newState = {
    ...state,
    loading: false,
    hierarchy: createHierarchyFromTree(data),
    properties: createPropertiesFromTree(data),
  };
  return newState;
};

export default cellSetsLoaded;
