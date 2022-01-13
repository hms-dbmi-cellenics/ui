/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from 'redux/reducers/cellSets/initialState';
import { createHierarchyFromTree, createPropertiesFromTree } from 'redux/reducers/cellSets/helpers';

const cellSetsLoaded = produce((draft, action) => {
  const { data } = action.payload;

  draft.loading = false;
  draft.hierarchy = createHierarchyFromTree(data);
  draft.properties = createPropertiesFromTree(data);
}, initialState);

export default cellSetsLoaded;
