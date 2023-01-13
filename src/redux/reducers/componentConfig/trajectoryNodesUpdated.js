/* eslint-disable no-param-reassign */
import produce, { original } from 'immer';

const trajectoryNodesSelectionUpdated = produce((draft, action) => {
  const { plotUuid, nodes, action: updateAction } = action.payload;

  let newNodes;
  const plotConfig = draft[plotUuid].config;

  if (updateAction === 'add') {
    newNodes = [...new Set([...nodes, ...original(draft[plotUuid]).config.selectedNodes])];
    plotConfig.selectedNodes = newNodes;
  } else {
    plotConfig.selectedNodes = plotConfig.selectedNodes.filter((node) => !nodes.includes(node));
  }

  draft[plotUuid].outstandingChanges = true;
});

export default trajectoryNodesSelectionUpdated;
