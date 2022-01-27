/* eslint-disable no-param-reassign */
import produce from 'immer';

// Only works with scratchpad
const cellSetsCreate = produce((draft, action) => {
  const {
    key, name, color, cellIds, type,
  } = action.payload;

  const scratchpadIndex = draft.hierarchy.findIndex((rootNode) => rootNode.key === 'scratchpad');
  draft.hierarchy[scratchpadIndex].children.push({ key });

  draft.properties[key] = {
    key, name, color, cellIds: new Set(cellIds), type, parentNodeKey: 'scratchpad',
  };
});

export default cellSetsCreate;
