import { createHierarchyFromTree, createPropertiesFromTree } from './helpers';

const cellSetsClusteringUpdated = (state, action) => {
  const { data } = action.payload;

  return {
    ...state,
    loading: false,
    updatingClustering: false,
    hierarchy: createHierarchyFromTree(data),
    properties: createPropertiesFromTree(data),
  };
};

export default cellSetsClusteringUpdated;
