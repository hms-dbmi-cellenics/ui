/* eslint-disable no-param-reassign */
import _ from 'lodash';
import produce from 'immer';

const cellClassDelete = produce((draft, action) => {
  const { key } = action.payload;

  // Remove cellClass from hierarchy
  const cellClassIndex = draft.hierarchy.findIndex((rootNode) => rootNode.key === key);
  const cellSetKeys = draft.hierarchy[cellClassIndex]
    .children.map(({ key: cellSetKey }) => cellSetKey);

  // Remove cell clas from hierarchy
  draft.hierarchy.splice(cellClassIndex, 1);

  // Delete from the properties as well.
  delete draft.properties[key];

  cellSetKeys.forEach((cellSetKey) => {
    // Delete cell sets under cell class
    delete draft.properties[cellSetKey];

    // Delete cell sets from hidden
    draft.hidden.delete(cellSetKey);
  });

  // Remove keys in selected cell sets
  _.remove(draft.selected,
    (currentSelectedKey) => cellSetKeys.includes(currentSelectedKey));
});

export default cellClassDelete;
