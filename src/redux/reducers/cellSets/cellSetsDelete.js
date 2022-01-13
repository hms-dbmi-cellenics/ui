/* eslint-disable no-param-reassign */
import _ from 'lodash';
import produce, { current } from 'immer';

import initialState from 'redux/reducers/cellSets/initialState';

const cellSetsDelete = produce((draft, action) => {
  const { key } = action.payload;
  const { parentNodeKey } = current(draft).properties[key];

  // Remove cellSet from hierarchy
  const cellClassIndex = draft.hierarchy.findIndex((rootNode) => rootNode.key === parentNodeKey);
  _.remove(draft.hierarchy[cellClassIndex].children, ({ key: currentKey }) => currentKey === key);

  // Delete from the properties as well.
  delete draft.properties[key];

  // If the key was in the list of selected keys, make sure we remove it from there.
  _.remove(draft.selected.cellSets, (currentSelectedKey) => currentSelectedKey === key);

  // Delete from hidden if it was selected to be hidden.
  draft.hidden.delete(key);
}, initialState);

export default cellSetsDelete;
