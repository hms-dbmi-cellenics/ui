/* eslint-disable no-param-reassign */
import produce from 'immer';

import { createHierarchyFromTree } from 'redux/reducers/cellSets/helpers';

import initialState from 'redux/reducers/cellSets/initialState';

const cellSetsUpdateHierarchy = produce((draft, action) => {
  const { hierarchy } = action.payload;

  draft.hierarchy = createHierarchyFromTree(hierarchy);
}, initialState);

export default cellSetsUpdateHierarchy;
