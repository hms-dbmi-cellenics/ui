import { createHierarchyFromTree } from './helpers';

const cellSetsUpdateHierarchy = (state, action) => {
  const { hierarchy } = action.payload;

  return {
    ...state,
    hierarchy: createHierarchyFromTree(hierarchy),
  };
};

export default cellSetsUpdateHierarchy;
