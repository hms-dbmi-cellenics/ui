import { createHierarchyFromTree, createPropertiesFromTree } from './helpers';
import initialState from './initialState';

const cellSetsLoaded = (state, action) => {
  const { data, reset = false } = action.payload;
  if (reset) {
    return initialState;
  }
  const newState = {
    ...state,
    loading: false,
    hierarchy: createHierarchyFromTree(data),
    properties: createPropertiesFromTree(data),
  };
  return newState;
};

export default cellSetsLoaded;
