import { DOWNSAMPLED_GENES_EXPRESSION_UPDATE_CELL_ORDER } from 'redux/actionTypes/genes';
import getHeatmapCellOrder from 'utils/work/getHeatmapCellOrder';

const updateDownsampledCellOrder = (componentUuid) => (dispatch, getState) => {
  const state = getState();

  const config = state.componentConfig[componentUuid]?.config;
  if (!config || !config.selectedCellSet || !config.groupedTracks) {
    return;
  }

  const { groupedTracks, selectedCellSet, selectedPoints } = config;
  let hiddenCellSets = Array.from(state.cellSets.hidden);
  const cellSetData = state.cellSets;

  // Convert selectedPoints into hidden cell sets
  // If selectedPoints is not "All", hide all cells in that category except the selected one
  if (selectedPoints && selectedPoints !== 'All') {
    // selectedPoints format: "root/child" (e.g., "sample/sample-1")
    const parts = selectedPoints.split('/');
    if (parts.length === 2) {
      const [rootKey, selectedChildKey] = parts;
      const rootNode = cellSetData.hierarchy.find((node) => node.key === rootKey);

      if (rootNode) {
        // Hide all children in this root except the selected one
        rootNode.children.forEach((child) => {
          if (child.key !== selectedChildKey && !hiddenCellSets.includes(child.key)) {
            hiddenCellSets.push(child.key);
          }
        });

        // Unhide the selected child if it was hidden
        hiddenCellSets = hiddenCellSets.filter((key) => key !== selectedChildKey);
      }
    }
  }

  // Defer expensive cellOrder computation to unblock UI
  setTimeout(() => {
    console.time('[getHeatmapCellOrder] total');
    const cellOrder = getHeatmapCellOrder(
      selectedCellSet,
      groupedTracks,
      'All', // Always pass 'All' since filtering is done via hiddenCellSets
      hiddenCellSets,
      cellSetData,
    );
    console.timeEnd('[getHeatmapCellOrder] total');

    // Update Redux with new cell order
    dispatch({
      type: DOWNSAMPLED_GENES_EXPRESSION_UPDATE_CELL_ORDER,
      payload: {
        componentUuid,
        cellOrder,
      },
    });
  }, 0);
};

export default updateDownsampledCellOrder;
