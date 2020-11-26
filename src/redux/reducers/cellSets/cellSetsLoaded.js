import { createHierarchyFromTree, createPropertiesFromTree } from './helpers';

const cellSetsLoaded = (state, action) => {
  const { data } = action.payload;

  const properties = createPropertiesFromTree(data);

  return {
    ...state,
    loading: false,
    hierarchy: createHierarchyFromTree(data),
    properties,
  };
};

export default cellSetsLoaded;
