import { createHierarchyFromTree, createPropertiesFromTree } from './helpers';

const cellSetsLoaded = (state, action) => {
  const { data, order } = action.payload;

  return {
    ...state,
    loading: false,
    hierarchy: createHierarchyFromTree(data, order),
    properties: createPropertiesFromTree(data),
  };
};

export default cellSetsLoaded;
