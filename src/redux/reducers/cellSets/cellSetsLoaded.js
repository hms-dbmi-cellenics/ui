import { createHierarchyFromTree, createPropertiesFromTree } from './helpers';

const cellSetsLoaded = (state, action) => {
  const { data } = action.payload;

  return {
    ...state,
    loading: false,
    hierarchy: createHierarchyFromTree(data),
    properties: createPropertiesFromTree(data),
  };
};

export default cellSetsLoaded;
